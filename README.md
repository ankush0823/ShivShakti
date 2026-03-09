# Event Activity Planner – Full Project

**⚠️ Note:** This repository contains the **complete Event Activity Planner application**, including both **frontend** and **backend** code.  

- **Frontend:** Handles UI, dashboard, forms, and event display  
- **Backend:** Handles server, APIs, and database integration  

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Features](#features)  
3. [Technologies Used](#technologies-used)  
4. [Folder Structure](#folder-structure)  
5. [Installation & Setup](#installation--setup)  
6. [Running the Application](#running-the-application)  
7. [Usage](#usage)  
8. [Contribution](#contribution)  
9. [License](#license)  

---

## Project Overview

The **Event Activity Planner** is a full-stack web application for managing events. It provides:  

- **Admin Dashboard:** Manage events, approve or reject submissions  
- **Event Display:** View upcoming events with images and details  
- **Form Submissions:** Users can submit new events  
- **Backend API Integration:** Handles data storage, retrieval, and server logic  

This repository combines the **frontend** and **backend** to form a complete working application.

---

## Features

- **Full-Stack Functionality:** Complete frontend and backend integration  
- **Responsive Design:** Works on desktop, tablet, and mobile  
- **Dashboard Management:** Admin can approve or reject events  
- **Event Cards:** Dynamic display of event details with images  
- **Form Submission:** Users can submit events via forms  
- **Server APIs:** Handles CRUD operations for events  
- **Data Persistence:** Stores event data in a database  
- **Frontend Validation:** Ensures correct user input  
- **Reusable Components:** Buttons, cards, modals for consistent UI  

---

## Technologies Used

### Frontend
- **HTML5, CSS3, JavaScript (ES6)** – UI, styling, and interactivity  
- **Bootstrap (optional)** – Responsive design  
- **Font Awesome** – Icons  

### Backend
- **Node.js & Express.js** – Server and API handling  
- **MongoDB / Mongoose** – Database for storing event data  
- **Multer** – File uploads for event images  
- **CORS** – Cross-origin requests handling  

--- 


> **Note:** This repository contains both **frontend and backend**, unlike the frontend-only repository.

---

## Installation & Setup

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/event-activity-planner.git
```

2. **Navigate to the backend folder:**
```cd backend```

3. **Install backend dependencies:**
```npm install```

## Running the Application

1. **Start the backend srever**
```
cd backend
node server.js

```
2. **Open frontend in browser:**

- Open index.html directly, or
- Use a local server like VS Code Live Server for better experience.

3. **Access the dashboard:**
```http://localhost:3000/dashboard.html```


# Usage- Admin can view, approve, or reject events through the dashboard.
- Event cards dynamically display images and details (fetched from backend).
- Users can submit events via forms, which are processed and stored by the backend.
- Frontend forms include validation to ensure correct input.
