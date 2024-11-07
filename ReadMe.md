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
MONGODB_URI=
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Installation & Setup

1. **Clone the repository**:

    ```bash
    git clone 
    cd tremendoServer
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

### User Routes (`user.js`)
These routes handle user management, including authentication, password reset, and email verification.

- **`POST /register`** - Register a new user (rate-limited).
- **`POST /login`** - Log in a user.
- **`POST /request-password-reset`** - Request a password reset link.
- **`POST /reset-password`** - Reset a user's password.
- **`POST /logout`** - Log out a user.
- **`GET /verify-email`** - Verify a user's email.
- **`POST /resend-verification`** - Resend the email verification link.
- **`GET /`** - Get authenticated user data.

### Board Routes (`board.js`)
These routes allow users to manage Kanban boards.

- **`GET /`** - Retrieve all boards for the authenticated user.
- **`POST /`** - Create a new board.
- **`GET /:id`** - Retrieve details of a specific board by ID.
- **`PUT /:id`** - Update a specific board.
- **`DELETE /:id`** - Delete a board.

### List Routes (`list.js`)
These routes manage lists within a specific board.

- **`GET /:boardId`** - Get all lists within a specified board.
- **`POST /:boardId`** - Create a new list within a specified board.
- **`PUT /:id`** - Update a specific list.
- **`DELETE /:id`** - Delete a specific list.

### Card Routes (`card.js`)
These routes manage cards within lists on a board.

- **`GET /:boardId/cards`** - Retrieve all cards within a specified board.
- **`POST /:boardId/cards`** - Create a new card within a board.
- **`GET /cards/:id`** - Retrieve details of a specific card by ID.
- **`PUT /cards/:id`** - Update a specific card.
- **`DELETE /cards/:id`** - Delete a specific card.
- **`POST /cards/:id/comments`** - Add a comment to a specific card.
- **`DELETE /cards/:cardId/comments/:commentId`** - Delete a comment from a specific card.

## Technologies Used
- **Express.js** - Node.js framework for building RESTful APIs.
- **MongoDB** - NoSQL database for data storage.
- **Mongoose** - ODM for MongoDB.
- **Passport JWT (JSON Web Tokens)** - For secure user authentication.
- **bcrypt** - For password hashing.
- **Resend** - For email verification and password reset.
- **Google Recaptcha** - For increased registration security.


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
