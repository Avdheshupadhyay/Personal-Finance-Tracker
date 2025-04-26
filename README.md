# React Financial Tracker App with Firebase

## Project Description
This is a full-stack React financial tracker application that allows users to track their financial transactions. The app uses Firebase as the backend for data storage and authentication. It also incorporates Ant Design components for UI, react-apexchart for data visualization, and CRUD operations on Firebase for managing financial records.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Demo](#demo)
3. [Technologies Used](#technologies-used)
4. [Setup and Installation](#setup-and-installation)
5. [Features](#features)
6. [Usage](#usage)

## Project Overview
The React Financial Tracker App is designed to help users keep track of their income and expenses. Users can add, edit, delete transactions, and view their financial data in the form of charts.

## Demo
https://github.com/Ajay-Chaudhari01001/Financely/assets/55138445/a792125e-7ddb-4f0b-a1a4-db28a59b9f92

#### Live Link - https://financetracker22.netlify.app/

## Technologies Used
- react: "18.2.0",
- firebase: "10.0.0",
- antd: "5.7.0",
- moment: "2.29.4",
- papaparse: "5.4.1",
- react-apexcharts: "1.4.1",
- react-firebase-hooks: "5.1.1",
- react-icons: "4.10.1",
- react-router-dom: "6.14.1",
- react-toastify: "9.1.3",

## Setup and Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Ajay-Chaudhari01001/ShivayLedger.git
   cd react-financial-tracker-app

1. Install dependencies::
   ```bash
   npm install

2. Configure Firebase:
   - Create a Firebase project on the Firebase Console (https://console.firebase.google.com/).
   - Obtain your Firebase configuration credentials (apiKey, authDomain, projectId, etc.).
   - Create a .env file in the root directory and add your Firebase credentials:
   ```maekfile
   REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
   REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
   REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
   REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
   REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID

3. Start the development server:
   ```bash
   npm start

## Features
- User authentication with Firebase.
- Add income and expenses transactions.
- Edit and delete transactions.
- View transactions in a tabular format.
- Visualize financial data with charts powered by Chart.js.
- Color switcher to toggle between multiple themes.
- **Import and Export Data:**
  - Users can import and export their financial data as a CSV file.
  - To import data, users can upload a CSV file containing transaction details.
  - To export data, users can download their financial records as a CSV file.
- **Exporting Data:**
   - Log in to the app and navigate to the dashboard.
   - Click the "Export Data" button on the dashboard.
   - The app will generate a CSV file containing all the financial records.
   - Click the "Download" button to save the CSV file to your local machine.

## Usage
1) Authentication:
 - Users can sign up or log in using their email and password and google account through the Firebase authentication system.
 - Once logged in, users will be redirected to the main dashboard.

2) Adding Transactions:
 - On the dashboard, users can click the Add Income and Add Expense button to open a form for adding new income or expense records.
 - Users can enter the transaction amount, category, description, and select whether it's income or expense.
 - Click the "Add" button to save the transaction to the Firebase Firestore database.

3) Editing and Deleting Transactions:
 - Users can edit a transaction by clicking to the specific transaction on the table.
 - The app will open a modal with the transaction details, allowing users to make changes.
 - Click the "Save" button to save the edited transaction.
 - And same steps for delete a transaction 

4) Viewing Financial Data:
 - The app provides a table that displays all transactions with relevant details (date, category, amount, etc.).
 - Users can view their financial data in both income and expense categories.
 - Additionally, users can visualize their data through various charts available on the dashboard, powered by Chart.js.

5) Color Switcher:
 - The app includes a color switcher feature that toggles between multiple colors theme.
 - Users can click the setting gear icon and change a color, enhancing user experience and accessibility.

6) Import and Export Data:
   1. **Importing Data:**
      - Prepare a CSV file with the following format: `name, amout, type, date`.
      - Log in to the app and navigate to the dashboard.
      - Click the "Import Data" button on the dashboard.
      - Upload the CSV file from your local machine.
      - The app will process the data and add the transactions to the existing records.
   2. **Exporting Data:**
      - Log in to the app and navigate to the dashboard.
      - Click the "Export Data" button on the dashboard.
      - The app will generate a CSV file containing all the financial records.
      - Click the "Download" button to save the CSV file to your local machine.
