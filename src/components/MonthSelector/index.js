import React, { useState, useEffect } from "react";
import { Select, Button, Modal, Form, DatePicker, message } from "antd";
import { PlusOutlined, CalendarOutlined } from "@ant-design/icons";
import { collection, getDocs, query, setDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebaseInit";
import { useAuthState } from "react-firebase-hooks/auth";
import moment from "moment";
import "./styles.css";

const { Option } = Select;
const { MonthPicker } = DatePicker;

const MonthSelector = ({ 
  selectedMonth, 
  setSelectedMonth, 
  availableMonths,
  fetchAvailableMonths
}) => {
  const [user] = useAuthState(auth);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

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

  const showCreateModal = () => {
    setIsCreateModalVisible(true);
  };

  const handleCancel = () => {
    setIsCreateModalVisible(false);
    form.resetFields();
  };

  const createNewMonth = async (values) => {
    try {
      setLoading(true);
      const selectedDate = values.month.format("YYYY-MM");
      
      // Check if month already exists
      if (availableMonths.some(m => m.id === selectedDate)) {
        message.warning("This month already exists!");
        setLoading(false);
        return;
      }
      
      // Create new month record
      const monthRef = doc(db, `users/${user.uid}/months/${selectedDate}`);
      await setDoc(monthRef, {
        id: selectedDate,
        name: formatMonthName(selectedDate),
        createdAt: new Date().toISOString(),
        income: 0,
        expense: 0,
        transactions: []
      });
      
      // Refresh available months
      await fetchAvailableMonths();
      
      // Set as selected month
      setSelectedMonth(selectedDate);
      
      message.success(`Created ${formatMonthName(selectedDate)}`);
      setIsCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error creating month:", error);
      message.error("Failed to create month");
    } finally {
      setLoading(false);
    }
  };

  // Create current month if it doesn't exist yet
  useEffect(() => {
    const checkAndCreateCurrentMonth = async () => {
      if (user && availableMonths) {
        const currentMonthId = getCurrentMonth();
        
        // Check if current month exists
        if (!availableMonths.some(m => m.id === currentMonthId)) {
          try {
            const monthRef = doc(db, `users/${user.uid}/months/${currentMonthId}`);
            await setDoc(monthRef, {
              id: currentMonthId,
              name: formatMonthName(currentMonthId),
              createdAt: new Date().toISOString(),
              income: 0,
              expense: 0,
              transactions: []
            });
            
            // Refresh available months
            await fetchAvailableMonths();
            
            // If no month is selected, select the current month
            if (!selectedMonth) {
              setSelectedMonth(currentMonthId);
            }
          } catch (error) {
            console.error("Error creating current month:", error);
          }
        } else if (!selectedMonth) {
          // If no month is selected but current month exists, select it
          setSelectedMonth(currentMonthId);
        }
      }
    };
    
    checkAndCreateCurrentMonth();
  }, [user, availableMonths, fetchAvailableMonths, selectedMonth, setSelectedMonth]);

  // Sort months by date (newest first)
  const sortedMonths = [...(availableMonths || [])].sort((a, b) => {
    return b.id.localeCompare(a.id);
  });

  return (
    <div className="month-selector-container">
      <div className="month-selector-label">
        <CalendarOutlined /> Select Month:
      </div>
      <Select
        className="month-select"
        value={selectedMonth}
        onChange={setSelectedMonth}
        placeholder="Select a month"
        loading={!availableMonths}
      >
        {sortedMonths.map(month => (
          <Option key={month.id} value={month.id}>
            {formatMonthName(month.id)}
          </Option>
        ))}
      </Select>
      
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={showCreateModal}
        className="create-month-btn"
      >
        Add Month
      </Button>
      
      <Modal
        title="Create New Month"
        visible={isCreateModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          onFinish={createNewMonth}
          layout="vertical"
          initialValues={{
            month: moment(),
          }}
        >
          <Form.Item
            name="month"
            label="Select Month"
            rules={[{ required: true, message: 'Please select a month' }]}
          >
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item className="form-buttons">
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MonthSelector;
