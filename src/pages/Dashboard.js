import React, { useEffect, useState, useCallback } from "react";
import Cards from "../components/Cards";
import Modal from "antd/es/modal/Modal";
import AddExpense from "../components/Modals/addExpense";
import AddIncome from "../components/Modals/addIncome";
import { toast } from "react-toastify";
import { auth, db } from "../firebaseInit";
import { addDoc, collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import TransactionsTable from "../components/TransactionsTable";
import FinancialJourneyFlow from "../components/Charts";
import MonthSelector from "../components/MonthSelector";
import { FaLinkedin, FaGlobe, FaStar } from "react-icons/fa";

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  // all transactions storing this array after that fetching into doc
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  
  // Month selection and management
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  

  
  // Alert tracking state - prevent duplicate alerts
  const [shownAlerts, setShownAlerts] = useState({
    fiftyPercent: false,
    eightyPercent: false,
    ninetyPercent: false
  });

  // Calculate the initial balance, income and expenses
  const calculateBalance = useCallback(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += parseFloat(transaction.amount);
      } else {
        totalExpense += parseFloat(transaction.amount);
      }
    });

    setIncome(totalIncome);
    setExpense(totalExpense);
    setCurrentBalance(totalIncome - totalExpense);
  }, [transactions]);

  // Fetch all available months for current user
  const fetchAvailableMonths = useCallback(async () => {
    if (user) {
      try {
        const monthsRef = collection(db, `users/${user.uid}/months`);
        const monthsSnapshot = await getDocs(monthsRef);
        
        let monthsArray = [];
        monthsSnapshot.forEach((doc) => {
          monthsArray.push({ ...doc.data(), id: doc.id });
        });
        
        setAvailableMonths(monthsArray);
        return monthsArray;
      } catch (error) {
        console.error("Error fetching months:", error);
        toast.error("Failed to load months");
        return [];
      }
    }
    return [];
  }, [user]);
  
  
  
  // Fetch transactions for the selected month
  const fetchTransactions = useCallback(async () => {
    if (user && selectedMonth) {
      try {
        // Get the month document to access its transactions
        const monthRef = doc(db, `users/${user.uid}/months/${selectedMonth}`);
        const monthDoc = await getDoc(monthRef);
        
        if (monthDoc.exists()) {
          const monthData = monthDoc.data();
          // Get the transactions from the month document
          const transactionArray = monthData.transactions || [];
          setTransactions(transactionArray);
          
          // Update income and expense from the month document
          setIncome(monthData.income || 0);
          setExpense(monthData.expense || 0);
          setCurrentBalance((monthData.income || 0) - (monthData.expense || 0));
        } else {
          // Month document doesn't exist, reset everything
          setTransactions([]);
          setIncome(0);
          setExpense(0);
          setCurrentBalance(0);
        }
      } catch (error) {
        console.error("Error fetching transactions for month:", error);
        toast.error("Failed to load transactions for this month");
      } finally {
      }
    }
  }, [user, selectedMonth]);
  

  




  const showExpenseModal = () => {
    setIsExpenseModalVisible(true);
  };

  const showIncomeModal = () => {
    setIsIncomeModalVisible(true);
  };

  const handleExpenseCancel = () => {
    setIsExpenseModalVisible(false);
  };

  const handleIncomeCancel = () => {
    setIsIncomeModalVisible(false);
  };

  // Adding an income and expense to the firebase collection under user ID
  const onFinish = (values, type) => {
  const amount = Number(values.amount);
  if (isNaN(amount) || amount <= 0) {
    toast.error("Please enter a valid expense amount");
    return;
  }
  const newTransaction = {
    type: type,
    date: values.date.format("DD-MM-YYYY"),
    amount, // already a number
    name: values.name,
  };
  setTransactions([...transactions, newTransaction]);
  setIsExpenseModalVisible(false);
  setIsIncomeModalVisible(false);
  addTransaction(newTransaction);
};

  const addTransaction = async (transaction, many) => {
    try {
      if (!selectedMonth) {
        toast.error("Please select a month first");
        return;
      }
      
      // Add the current month to the transaction data
      const transactionWithMonth = {
        ...transaction,
        monthId: selectedMonth
      };
      // Debug: Log the transaction being added
      console.log('Adding transactionWithMonth:', transactionWithMonth);
      console.log('Original transaction:', transaction);

      
      // Get the current month document
      const monthRef = doc(db, `users/${user.uid}/months/${selectedMonth}`);
      const monthDoc = await getDoc(monthRef);
      
      if (monthDoc.exists()) {
        const monthData = monthDoc.data();
        const currentTransactions = monthData.transactions || [];
        const updatedTransactions = [...currentTransactions, transactionWithMonth];
        
        // Calculate new totals
        let monthlyIncome = monthData.income || 0;
        let monthlyExpense = monthData.expense || 0;
        console.log('Before update - monthlyIncome:', monthlyIncome, 'monthlyExpense:', monthlyExpense);
        
        if (transaction.type === "income") {
          monthlyIncome += parseFloat(transaction.amount);
        } else if (transaction.type === "expense") {
          monthlyExpense += parseFloat(transaction.amount);
        } else {
          console.warn('Unknown transaction type:', transaction.type);
        }
        console.log('After update - monthlyIncome:', monthlyIncome, 'monthlyExpense:', monthlyExpense);
        
        // Update the month document with new transaction and totals
        await updateDoc(monthRef, {
          transactions: updatedTransactions,
          income: monthlyIncome,
          expense: monthlyExpense,
          updatedAt: new Date().toISOString()
        });
        
        // Only show success notification once
        if (!many) toast.success("Transaction Added!", { toastId: 'transaction-added' });
        
        // Update local state
        setTransactions(updatedTransactions);
        setIncome(monthlyIncome);
        setExpense(monthlyExpense);
        setCurrentBalance(monthlyIncome - monthlyExpense);
      } else {
        toast.error("Selected month not found");
      }
    } catch (err) {
      if (!many) toast.error("Couldn't add transaction");
      console.error("Error adding transaction:", err);
    }
  };
  
  const handleFeedback = async (star) => {
    setRating(star);
    if (user) {
      try {
        await addDoc(collection(db, `users/${user.uid}/feedback`), { rating: star, date: new Date() });
        toast.success(`Thanks for your ${star}-star feedback!`);
      } catch (err) {
        console.error("Error submitting feedback:", err);
        toast.error("Failed to submit feedback");
      }
    } else {
      toast.warning("Please log in to submit feedback");
    }
  };

  useEffect(() => {
    // First, fetch available months
    if (user) {
      fetchAvailableMonths();
    }
  }, [user, fetchAvailableMonths]);
  
  // When selectedMonth changes, fetch transactions for that month
  useEffect(() => {
    if (user && selectedMonth) {
      fetchTransactions();
    }
  }, [user, selectedMonth, fetchTransactions]);

  useEffect(() => {
    calculateBalance();
  }, [transactions, calculateBalance]);
  

  // Enhanced expense alert logic - showing alert only once per session
  useEffect(() => {
    // Only run this effect once after initial calculations are complete
    const timer = setTimeout(() => {
      if (income > 0) {
        const expenseRatio = expense / income;
        const expensePercentage = (expenseRatio * 100).toFixed(0);
        
        // Create a copy of the current state
        const newShownAlerts = {...shownAlerts};
        let alertToShow = null;
        
        // Only show alerts at 90%, 80%, and 50% thresholds
        if (expenseRatio >= 0.9 && !shownAlerts.ninetyPercent) {
          alertToShow = {
            message: `CRITICAL ALERT: Your expenses have reached ${expensePercentage}% of your income! Immediate action recommended.`,
            type: "error",
            duration: 15000,
            icon: "🚨"
          };
          newShownAlerts.ninetyPercent = true;
        } else if (expenseRatio >= 0.8 && !shownAlerts.eightyPercent) {
          alertToShow = {
            message: `WARNING: You're spending ${expensePercentage}% of your income. Aim to keep expenses below 80%.`,
            type: "warn",
            duration: 12000,
            icon: "⚠️"
          };
          newShownAlerts.eightyPercent = true;
        } else if (expenseRatio >= 0.5 && !shownAlerts.fiftyPercent) {
          alertToShow = {
            message: `NOTICE: You've spent ${expensePercentage}% of your income. Continue monitoring your expenses.`,
            type: "info",
            duration: 8000,
            icon: "ℹ️"
          };
          newShownAlerts.fiftyPercent = true;
        }
        
        // Show exactly one alert if needed
        if (alertToShow) {
          // Display the alert based on its type
          switch(alertToShow.type) {
            case "error":
              toast.error(alertToShow.message, { 
                autoClose: alertToShow.duration, 
                icon: alertToShow.icon,
                toastId: 'expense-alert' // Prevents duplicate toasts
              });
              break;
            case "warn":
              toast.warn(alertToShow.message, { 
                autoClose: alertToShow.duration, 
                icon: alertToShow.icon,
                toastId: 'expense-alert' // Prevents duplicate toasts
              });
              break;
            case "info":
              toast.info(alertToShow.message, { 
                autoClose: alertToShow.duration, 
                icon: alertToShow.icon,
                toastId: 'expense-alert' // Prevents duplicate toasts
              });
              break;
            default:
              break;
          }
          
          // Update which alerts have been shown
          setShownAlerts(newShownAlerts);
        }
      }
    }, 2000); // Delay to ensure calculations are complete
    
    return () => clearTimeout(timer); // Cleanup on unmount
  }, [expense, income, shownAlerts]);


  
  return (
    <div>
      <Cards
        showExpenseModal={showExpenseModal}
        showIncomeModal={showIncomeModal}
        income={income}
        expense={expense}
        currentBalance={currentBalance}
      />
      
      {/* Month Selector Component */}
      <div className="container">
        <MonthSelector
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          availableMonths={availableMonths}
          fetchAvailableMonths={fetchAvailableMonths}
        />
      </div>
      

      <Modal open={isIncomeModalVisible} onCancel={handleIncomeCancel}>
        Income
      </Modal>
      <Modal open={isExpenseModalVisible} onCancel={handleExpenseCancel}>
        Expense
      </Modal>
      <AddExpense
        isExpenseModalVisible={isExpenseModalVisible}
        handleExpenseCancel={handleExpenseCancel}
        onFinish={onFinish}
        selectedMonth={selectedMonth}
      />
      <AddIncome
        isIncomeModalVisible={isIncomeModalVisible}
        handleIncomeCancel={handleIncomeCancel}
        onFinish={onFinish}
        selectedMonth={selectedMonth}
      />
      

      <div className="chart container">
        {transactions.length !== 0 ? (
          <div className="line-chart">
            <FinancialJourneyFlow transactions={transactions} />
          </div>
        ) : (
          <div className="no-transaction">
            <h2>No Transactions Available</h2>
            <img
              src={process.env.PUBLIC_URL + "/coin.gif"}
              alt="No-transaction-img"
            />
          </div>
        )}
      </div>
      

      <TransactionsTable
        transactions={transactions}
        addTransaction={addTransaction}
        fetchTransactions={fetchTransactions}
      />
      
      {/* Contact Me */}
      <div style={{ marginTop: '40px', textAlign: 'center', padding: '20px', borderTop: '1px solid #f0f0f0' }}>
        <h3>Contact Me</h3>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
          <a href="https://github.com/Avdheshupadhyay" target="_blank" rel="noopener noreferrer">
            <img src="https://github.com/Avdheshupadhyay.png" alt="GitHub Profile" style={{ width: '60px', borderRadius: '50%' }} />
          </a>
          <a href="https://www.linkedin.com/in/avdhesh-upadhyay-643a382b0/" target="_blank" rel="noopener noreferrer">
            <FaLinkedin size={40} color="#0077b5" />
          </a>
          <a href="https://my-portfolio-steel-seven-85.vercel.app/" target="_blank" rel="noopener noreferrer">
            <FaGlobe size={40} color="#333" />
          </a>
        </div>
      </div>
      
      {/* Feedback Widget */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 5px 0' }}>Feedback</h4>
        <div style={{ display: 'flex' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              size={20}
              style={{
                marginRight: '5px',
                cursor: 'pointer',
                color: star <= (hoverRating || rating) ? '#ffc107' : '#e4e5e9'
              }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleFeedback(star)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
