import React, { useState, useEffect } from "react";
import { FaMoneyBillWave, FaPiggyBank, FaLongArrowAltRight } from "react-icons/fa";
import { BsCashStack, BsCreditCard2Back } from "react-icons/bs";
import { GiPayMoney, GiReceiveMoney } from "react-icons/gi";
import "./styles.css";

const quotes = {
  income: [
    "Earning is the beginning of financial freedom.",
    "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.",
    "The habit of saving is itself an education; it fosters every virtue, teaches self-denial, cultivates the sense of order."
  ],
  expenses: [
    "Beware of little expenses; a small leak will sink a great ship.",
    "Do not save what is left after spending, but spend what is left after saving.",
    "A budget is telling your money where to go instead of wondering where it went."
  ],
  savings: [
    "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
    "The art is not in making money, but in keeping it.",
    "Wealth is not about having a lot of money; it's about having a lot of options."
  ]
};

const FinancialJourneyFlow = ({ transactions }) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [quote, setQuote] = useState({ income: "", expenses: "", savings: "" });
  
  // Calculate totals
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const savings = income - expenses;
  const savingsPercentage = income > 0 ? (savings / income * 100).toFixed(0) : 0;
  
  // Select random quotes
  useEffect(() => {
    setQuote({
      income: quotes.income[Math.floor(Math.random() * quotes.income.length)],
      expenses: quotes.expenses[Math.floor(Math.random() * quotes.expenses.length)],
      savings: quotes.savings[Math.floor(Math.random() * quotes.savings.length)]
    });
    
    // Start animation after component mounts
    setTimeout(() => setAnimationComplete(true), 500);
    
    // Refresh quotes periodically
    const interval = setInterval(() => {
      setQuote({
        income: quotes.income[Math.floor(Math.random() * quotes.income.length)],
        expenses: quotes.expenses[Math.floor(Math.random() * quotes.expenses.length)],
        savings: quotes.savings[Math.floor(Math.random() * quotes.savings.length)]
      });
    }, 15000); // Change quotes every 15 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="financial-journey-container">
      <h2 className="journey-title">Your Financial Journey</h2>
      
      <div className="journey-flow">
        {/* Income Section */}
        <div className="journey-node income-node">
          <div className="node-icon">
            <GiReceiveMoney className="icon primary-icon" />
            <FaMoneyBillWave className="icon secondary-icon" />
          </div>
          <div className="node-content">
            <h3>Income</h3>
            <div className="amount">₹{income.toFixed(2)}</div>
            <div className="quote-bubble">
              <p>"{quote.income}"</p>
            </div>
          </div>
        </div>
        
        {/* Flow Arrow 1 */}
        <div className="flow-arrow">
          <div className={`arrow-line ${animationComplete ? 'animated' : ''}`}></div>
          <FaLongArrowAltRight className="arrow-icon" />
        </div>
        
        {/* Expenses Section */}
        <div className="journey-node expenses-node">
          <div className="node-icon">
            <GiPayMoney className="icon primary-icon" />
            <BsCreditCard2Back className="icon secondary-icon" />
          </div>
          <div className="node-content">
            <h3>Expenses</h3>
            <div className="amount">₹{expenses.toFixed(2)}</div>
            <div className="quote-bubble">
              <p>"{quote.expenses}"</p>
            </div>
          </div>
        </div>
        
        {/* Flow Arrow 2 */}
        <div className="flow-arrow">
          <div className={`arrow-line ${animationComplete ? 'animated' : ''}`}></div>
          <FaLongArrowAltRight className="arrow-icon" />
        </div>
        
        {/* Savings Section */}
        <div className="journey-node savings-node">
          <div className="node-icon">
            <FaPiggyBank className="icon primary-icon" />
            <BsCashStack className="icon secondary-icon" />
          </div>
          <div className="node-content">
            <h3>Savings</h3>
            <div className={`amount ${savings < 0 ? 'negative' : ''}`}>
              ₹{savings.toFixed(2)}
              <span className="percentage">{savingsPercentage}% of income</span>
            </div>
            <div className="quote-bubble">
              <p>"{quote.savings}"</p>
            </div>
          </div>
          
          {/* Savings Progress */}
          <div className="savings-progress">
            <div className="progress-label">Savings Target: 20%</div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${parseFloat(savingsPercentage) >= 20 ? 'good' : 'needs-improvement'}`}
                style={{ width: `${Math.min(parseFloat(savingsPercentage) * 2, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile view for smaller screens */}
      <div className="journey-flow-mobile">
        {/* Income Section */}
        <div className="journey-node-mobile">
          <div className="node-header">
            <div className="node-icon-mobile">
              <GiReceiveMoney />
            </div>
            <h3>Income</h3>
          </div>
          <div className="amount">₹{income.toFixed(2)}</div>
          <div className="quote-bubble-mobile">
            <p>"{quote.income}"</p>
          </div>
          <div className="arrow-down">↓</div>
        </div>
        
        {/* Expenses Section */}
        <div className="journey-node-mobile">
          <div className="node-header">
            <div className="node-icon-mobile">
              <GiPayMoney />
            </div>
            <h3>Expenses</h3>
          </div>
          <div className="amount">₹{expenses.toFixed(2)}</div>
          <div className="quote-bubble-mobile">
            <p>"{quote.expenses}"</p>
          </div>
          <div className="arrow-down">↓</div>
        </div>
        
        {/* Savings Section */}
        <div className="journey-node-mobile">
          <div className="node-header">
            <div className="node-icon-mobile">
              <FaPiggyBank />
            </div>
            <h3>Savings</h3>
          </div>
          <div className={`amount ${savings < 0 ? 'negative' : ''}`}>
            ₹{savings.toFixed(2)}
            <span className="percentage">{savingsPercentage}% of income</span>
          </div>
          <div className="quote-bubble-mobile">
            <p>"{quote.savings}"</p>
          </div>
          
          {/* Savings Progress */}
          <div className="savings-progress">
            <div className="progress-label">Savings Target: 20%</div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${parseFloat(savingsPercentage) >= 20 ? 'good' : 'needs-improvement'}`}
                style={{ width: `${Math.min(parseFloat(savingsPercentage) * 2, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialJourneyFlow;
