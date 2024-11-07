# Tremendo Server

## Overview
This is the backend API for the Tremendo Kanban application, built with Express.js, Mongoose, and MongoDB. It provides all the necessary endpoints to manage boards, tasks, and user data.

## Prerequisites
Before running this project, make sure you have the following installed:
- **Node.js** (v14 or higher)
- **MongoDB**
- **npm** or **yarn**

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```plaintext
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tremendo
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Installation & Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/tremendo-backend.git
    cd tremendo-backend
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Start the server**:

    - **Development mode**:

        ```bash
        npm run dev
        ```

    - **Production mode**:

        ```bash
        npm start
        ```

## API Endpoints

### Authentication

- **`POST /auth/register`** - Register a new user.
- **`POST /auth/login`** - Log in a user.

### User Management

- **`GET /users/:id`** - Get user details by ID.
- **`PUT /users/:id`** - Update user information.
- **`DELETE /users/:id`** - Delete a user account.

### Boards

- **`GET /boards`** - Retrieve all boards for the authenticated user.
- **`POST /boards`** - Create a new board.
- **`GET /boards/:id`** - Retrieve details for a specific board.
- **`PUT /boards/:id`** - Update a specific board.
- **`DELETE /boards/:id`** - Delete a board.

### Tasks

- **`GET /tasks/:boardId`** - Retrieve all tasks for a specific board.
- **`POST /tasks`** - Create a new task.
- **`GET /tasks/:id`** - Retrieve details for a specific task.
- **`PUT /tasks/:id`** - Update a task.
- **`DELETE /tasks/:id`** - Delete a task.

## Technologies Used
- **Express.js** - Node.js framework for building RESTful APIs.
- **MongoDB** - NoSQL database for data storage.
- **Mongoose** - ODM for MongoDB.
- **JWT (JSON Web Tokens)** - For secure user authentication.
- **bcrypt** - For password hashing.

## Running Tests
Run the following command to execute tests:

```bash
npm test
```


## Contributing
1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/YourFeature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/YourFeature`.
5. Open a pull request.

## License
This project is licensed under the MIT License.
