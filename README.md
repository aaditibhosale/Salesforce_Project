# Salesforce_Project
# Salesforce Data Console

A full-stack web application that authenticates with Salesforce using **OAuth 2.0** and performs **CRUD (Create, Read, Update, Delete)** operations on Salesforce standard objects through a single web interface.

The application supports:

- Account
- Opportunity
- Lead
- Contact
- Case

The application allows users to work with Salesforce records without using the native Salesforce interface.

---

## Features

### Authentication
- Salesforce OAuth 2.0 authentication
- External Client App integration
- Server-side session management
- Access token and refresh token handling
- Logout functionality

### Salesforce Objects
Users can select the following objects from a central dropdown:

- Account
- Opportunity
- Lead
- Contact
- Case

### CRUD Operations

The application supports:

- **Create** — Create a new Salesforce record
- **Read** — View Salesforce records
- **Update** — Edit existing records
- **Delete** — Delete records
- **View** — Open a read-only record view

### Pagination

- Records are loaded **20 at a time**
- Additional records are loaded when the user reaches the end of the list

### Dynamic Fields

The backend describes the selected Salesforce object and provides the configured fields to the React frontend.

Each object exposes between **5 and 10 fields**.

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- Axios
- Express Session

### Salesforce

- Salesforce Developer Org
- External Client App
- OAuth 2.0
- Salesforce REST API

---

## Project Structure

```text
sf-crud-app/
│
├── backend/
│   ├── config/
│   │   └── objectFields.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   └── records.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RecordFormModal.jsx
│   │   │   └── RecordTable.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md
└── package-lock.json
