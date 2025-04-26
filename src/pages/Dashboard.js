import React, { useEffect, useState, useCallback } from "react";
import Cards from "../components/Cards";
import Modal from "antd/es/modal/Modal";
import AddExpense from "../components/Modals/addExpense";
import AddIncome from "../components/Modals/addIncome";
import { toast } from "react-toastify";
import { auth, db } from "../firebaseInit";
import { addDoc, collection, getDocs, updateDoc, query, doc, setDoc, getDoc, where, orderBy, limit } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import TransactionsTable from "../components/TransactionsTable";
import FinancialJourneyFlow from "../components/Charts";
import MonthSelector from "../components/MonthSelector";
import { FaLinkedin, FaGlobe } from "react-icons/fa";

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [isMonthlyModalVisible, setIsMonthlyModalVisible] = useState(false);
  // all transactions storing this array after that fetching into doc
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  
  // Month selection and management
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isMonthDataLoading, setIsMonthDataLoading] = useState(false);
  
  // Monthly tracking state
  const [monthlySummaries, setMonthlySummaries] = useState([]);
  
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
  
  // Format the month ID (YYYY-MM) to display name (April 2025)
  const formatMonthName = (monthId) => {
    if (!monthId) return "";
    try {
      const [year, month] = monthId.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch (err) {
      return monthId;
    }
  };
  
  // Fetch transactions for the selected month
  const fetchTransactions = useCallback(async () => {
    if (user && selectedMonth) {
      setIsMonthDataLoading(true);
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
        setIsMonthDataLoading(false);
      }
    }
  }, [user, selectedMonth]);
  
  // Fetch monthly summaries from Firebase
  const fetchMonthlySummaries = useCallback(async () => {
    if (user) {
      try {
        const summariesRef = collection(db, `users/${user.uid}/monthlySummaries`);
        const summariesSnapshot = await getDocs(summariesRef);
        let summariesArray = [];
        
        summariesSnapshot.forEach((doc) => {
          summariesArray.push({ ...doc.data(), id: doc.id });
        });
        
        // Sort by month (most recent first)
        summariesArray.sort((a, b) => b.month.localeCompare(a.month));
        setMonthlySummaries(summariesArray);
        
        if (summariesArray.length > 0) {
          console.log("Monthly summaries loaded:", summariesArray);
        }
      } catch (err) {
        console.error("Error fetching monthly summaries:", err);
      }
    }
  }, [user]);
  
  // Handle viewing a specific month's data
  const viewMonthDetails = (monthId) => {
    setSelectedMonth(monthId);
    setIsMonthlyModalVisible(true);
  };
  
  // Toggle monthly summary modal
  const handleMonthlyModalCancel = () => {
    setIsMonthlyModalVisible(false);
  };

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
    const newTransaction = {
      type: type,
      date: values.date.format("DD-MM-YYYY"),
      amount: parseFloat(values.amount),
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
        
        if (transaction.type === "income") {
          monthlyIncome += parseFloat(transaction.amount);
        } else {
          monthlyExpense += parseFloat(transaction.amount);
        }
        
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
        
        // Also update the monthly summaries
        updateMonthlySummary(selectedMonth);
      } else {
        toast.error("Selected month not found");
      }
    } catch (err) {
      if (!many) toast.error("Couldn't add transaction");
      console.error("Error adding transaction:", err);
    }
  };
  
  // Function to update or create monthly summary
  const updateMonthlySummary = async (monthId) => {
    try {
      if (!user) return;
      
      // Get all transactions for this month
      const monthTransactions = transactions.filter(transaction => {
        const transactionMonth = transaction.date.substring(3, 5);
        const transactionYear = transaction.date.substring(6, 10);
        return `${transactionYear}-${transactionMonth}` === monthId;
      });
      
      // Calculate totals for the month
      let monthlyIncome = 0;
      let monthlyExpense = 0;
      
      monthTransactions.forEach(transaction => {
        if (transaction.type === "income") {
          monthlyIncome += parseFloat(transaction.amount);
        } else {
          monthlyExpense += parseFloat(transaction.amount);
        }
      });
      
      const monthlySaving = monthlyIncome - monthlyExpense;
      
      // Update or create the monthly summary in Firebase
      const summaryRef = doc(db, `users/${user.uid}/monthlySummaries/${monthId}`);
      await setDoc(summaryRef, {
        month: monthId,
        income: monthlyIncome,
        expense: monthlyExpense,
        saving: monthlySaving,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Silent update without notification
      fetchMonthlySummaries();
    } catch (err) {
      console.error("Error updating monthly summary:", err);
      toast.error("Failed to update monthly summary");
    }
  };

  useEffect(() => {
    // First, fetch available months
    if (user) {
      fetchAvailableMonths();
      fetchMonthlySummaries();
    }
  }, [user, fetchAvailableMonths, fetchMonthlySummaries]);
  
  // When selectedMonth changes, fetch transactions for that month
  useEffect(() => {
    if (user && selectedMonth) {
      fetchTransactions();
    }
  }, [user, selectedMonth, fetchTransactions]);

  useEffect(() => {
    calculateBalance();
  }, [transactions, calculateBalance]);
  
  // Update monthly summary for the current month whenever transactions change
  useEffect(() => {
    if (user && transactions.length > 0) {
      const currentDate = new Date();
      const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      const currentYear = currentDate.getFullYear();
      const currentMonthId = `${currentYear}-${currentMonth}`;
      
      updateMonthlySummary(currentMonthId);
    }
  }, [transactions, user]);

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

  // MonthlyReportModal Component
  const MonthlyReportModal = () => {
    // Find the selected month in the summaries
    const monthData = monthlySummaries.find(summary => summary.id === selectedMonth) || {
      month: selectedMonth,
      income: 0,
      expense: 0,
      saving: 0
    };
    
    // Get month name for display
    const getMonthName = (monthId) => {
      try {
        const [year, month] = monthId.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      } catch (err) {
        return monthId;
      }
    };
    
    return (
      <Modal 
        title={`Monthly Summary: ${getMonthName(selectedMonth)}`}
        open={isMonthlyModalVisible} 
        onCancel={handleMonthlyModalCancel}
        footer={null}
        width={700}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <div style={{ textAlign: 'center', padding: '15px', background: '#f0f5ff', borderRadius: '8px', width: '30%' }}>
              <h3>Income</h3>
              <h2 style={{ color: '#52c41a' }}>₹{monthData.income.toFixed(2)}</h2>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#fff2f0', borderRadius: '8px', width: '30%' }}>
              <h3>Expenses</h3>
              <h2 style={{ color: '#ff4d4f' }}>₹{monthData.expense.toFixed(2)}</h2>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#f6ffed', borderRadius: '8px', width: '30%' }}>
              <h3>Savings</h3>
              <h2 style={{ color: monthData.saving >= 0 ? '#52c41a' : '#ff4d4f' }}>
                ₹{monthData.saving.toFixed(2)}
              </h2>
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <h3>Savings Rate</h3>
            <div style={{ height: '25px', background: '#f0f0f0', borderRadius: '4px', position: 'relative' }}>
              {monthData.income > 0 && (
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${(monthData.saving / monthData.income * 100).toFixed(0)}%`, 
                    background: monthData.saving >= 0 ? '#52c41a' : '#ff4d4f',
                    borderRadius: '4px',
                    maxWidth: '100%'
                  }}
                />
              )}
              <span style={{ position: 'absolute', top: '2px', left: '10px', color: '#fff', fontWeight: 'bold' }}>
                {monthData.income > 0 ? `${(monthData.saving / monthData.income * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          </div>
          
          {monthlySummaries.length > 1 && (
            <div style={{ marginTop: '30px' }}>
              <h3>Previous Months Comparison</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Month</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Income</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Expenses</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Savings</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummaries.slice(0, 6).map(summary => (
                      <tr key={summary.id} style={{ background: summary.id === selectedMonth ? '#e6f7ff' : 'transparent' }}>
                        <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                          {getMonthName(summary.id)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                          ₹{summary.income.toFixed(2)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                          ₹{summary.expense.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: '8px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid #ddd',
                          color: summary.saving >= 0 ? '#52c41a' : '#ff4d4f'
                        }}>
                          ₹{summary.saving.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: '8px', 
                          textAlign: 'right', 
                          borderBottom: '1px solid #ddd',
                          color: summary.income > 0 && summary.saving / summary.income >= 0.2 ? '#52c41a' : '#ff4d4f'
                        }}>
                          {summary.income > 0 ? `${(summary.saving / summary.income * 100).toFixed(0)}%` : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };
  
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
      
      {/* Monthly Reports Button */}
      <div className="container" style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <button 
          onClick={() => {
            if (selectedMonth) {
              setIsMonthlyModalVisible(true);
            } else {
              toast.warning("Please select a month first");
            }
          }}
          style={{
            padding: '10px 20px',
            background: 'var(--primary-purple)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          View Monthly Reports
        </button>
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
      
      {/* Monthly Report Modal */}
      <MonthlyReportModal />
      
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
      
      {/* Monthly Summary Cards */}
      {monthlySummaries.length > 0 && (
        <div className="container" style={{ marginTop: '30px', marginBottom: '30px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Monthly Summaries</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
            {monthlySummaries.slice(0, 3).map(summary => (
              <div 
                key={summary.id} 
                style={{ 
                  padding: '20px', 
                  background: 'white', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  width: '300px',
                  cursor: 'pointer'
                }}
                onClick={() => viewMonthDetails(summary.id)}
              >
                <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>
                  {new Date(parseInt(summary.id.split('-')[0]), parseInt(summary.id.split('-')[1]) - 1)
                    .toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Income:</span>
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>₹{summary.income.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Expenses:</span>
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>₹{summary.expense.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span>Savings:</span>
                  <span style={{ 
                    color: summary.saving >= 0 ? '#52c41a' : '#ff4d4f', 
                    fontWeight: 'bold' 
                  }}>₹{summary.saving.toFixed(2)}</span>
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', position: 'relative' }}>
                  {summary.income > 0 && (
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min((summary.saving / summary.income * 100), 100).toFixed(0)}%`, 
                        background: summary.saving >= 0 ? '#52c41a' : '#ff4d4f',
                        borderRadius: '4px'
                      }}
                    />
                  )}
                </div>
                <div style={{ marginTop: '5px', textAlign: 'center', fontSize: '12px' }}>
                  Savings Rate: {summary.income > 0 ? `${(summary.saving / summary.income * 100).toFixed(0)}%` : '0%'}
                </div>
              </div>
            ))}
          </div>
          {monthlySummaries.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button 
                onClick={() => {
                  setIsMonthlyModalVisible(true);
                }}
                style={{
                  padding: '8px 15px',
                  background: 'transparent',
                  color: 'var(--primary-purple)',
                  border: '1px solid var(--primary-purple)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                View All Months
              </button>
            </div>
          )}
        </div>
      )}
      
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
    </div>
  );
};

export default Dashboard;
