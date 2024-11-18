require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app'); // Ensure this is the correct path to your app
const Card = require('../../models/Card');
const User = require('../../models/User'); // If authentication is required, include User model
const jwt = require('jsonwebtoken');

const testDatabaseUri = process.env.MONGODB_URI_TEST;

describe('Card Controller Integration Tests', () => {
  let token;
  let boardId;
  let listId;
  let cardId;

  beforeAll(async () => {
    await mongoose.connect(testDatabaseUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a user to obtain a valid JWT token if authentication is required
    const user = await User.create({ email: 'testuser@example.com', password: 'password123' });
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Mock data
    boardId = new mongoose.Types.ObjectId().toString();
    listId = new mongoose.Types.ObjectId().toString();
  });

  afterAll(async () => {
    // Clean up test data and close the connection
    await Card.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /cards/:boardId/cards - Create a new card', () => {
    it('should create a new card successfully', async () => {
      const response = await request(app)
        .post(`/cards/${boardId}/cards`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          listId,
          name: 'Test Card',
          description: 'A card for testing',
          position: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Card');
      expect(response.body.description).toBe('A card for testing');
      
      // Ensure cardId is properly set
      cardId = response.body._id;
      console.log('Created cardId:', cardId);  // Log cardId to check if it’s correctly set

      // Validate that cardId is a valid ObjectId
      const isValidId = mongoose.Types.ObjectId.isValid(cardId);
      console.log('Is valid cardId?', isValidId);
      expect(isValidId).toBe(true);  // Assert cardId is a valid ObjectId
    });

    it('should fail if required fields are missing', async () => {
      const response = await request(app)
        .post(`/cards/${boardId}/cards`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Missing name and listId',
          position: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /cards/cards/:id - Update a card', () => {
    it('should update an existing card', async () => {
      // Ensure cardId is defined and valid before making the request
      if (!cardId || !mongoose.Types.ObjectId.isValid(cardId)) {
        throw new Error('Invalid cardId for PUT request');
      }

      const response = await request(app)
        .put(`/cards/cards/${cardId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Card',
          description: 'Updated description',
          position: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Card');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.position).toBe(2); // Ensure position is updated
    });
  });

  describe('DELETE /cards/cards/:id - Delete a card', () => {
    it('should delete an existing card', async () => {
      if (!cardId || !mongoose.Types.ObjectId.isValid(cardId)) {
        throw new Error('Invalid cardId for DELETE request');
      }

      const response = await request(app)
        .delete(`/cards/cards/${cardId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Card removed');
    });

    it('should return 404 if the card does not exist', async () => {
      const response = await request(app)
        .delete(`/cards/cards/${cardId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Card Comments', () => {
    let commentId;
    let cardWithCommentsId;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post(`/cards/${boardId}/cards`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          listId,
          name: 'Card for Comments',
          position: 5,
        });
      
      cardWithCommentsId = createResponse.body._id;
    });

    it('should add a comment to a card', async () => {
      const response = await request(app)
        .post(`/cards/${cardWithCommentsId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'This is a test comment',
        });
        console.log(response.status);  // Print status to debug
        console.log(response.body);  

      expect(response.status).toBe(201);
      expect(response.body.comments[0].text).toBe('This is a test comment');
      commentId = response.body.comments[0]._id;
    });

    it('should delete a comment from a card', async () => {
      // First, add a comment
      const addResponse = await request(app)
        .post(`/cards/${cardWithCommentsId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Comment to be deleted',
        });

      commentId = addResponse.body.comments[0]._id;

      // Then delete the comment
      const response = await request(app)
        .delete(`/cards/${cardWithCommentsId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Comment removed');
    });

    it('should return 404 if comment not found for deletion', async () => {
      const response = await request(app)
        .delete(`/cards/${cardWithCommentsId}/comments/invalidCommentId`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});




// // tests/cardController.test.js
// require('dotenv').config();
// const request = require('supertest');
// const mongoose = require('mongoose');
// const app = require('../../app'); // Make sure this points to your Express app
// const Card = require('../../models/Card');
// const User = require('../../models/User'); // If authentication is required, include User model
// const jwt = require('jsonwebtoken');


// const testDatabaseUri = process.env.MONGODB_URI_TEST;

// describe('Card Controller Integration Tests', () => {
//   let token;
//   let boardId;
//   let listId;
//   let cardId;

//   beforeAll(async () => {
//     // Connect to the test database
//     await mongoose.connect(testDatabaseUri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     // Create a user to obtain a valid JWT token if authentication is required
//     const user = await User.create({ email: 'testuser@example.com', password: 'password123' });
//     token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     // Mock data
//     boardId = new mongoose.Types.ObjectId().toString();
//     listId = new mongoose.Types.ObjectId().toString();
//   });

//   afterAll(async () => {
//     // Clean up test data and close the connection
//     await Card.deleteMany({});
//     await User.deleteMany({});
//     await mongoose.connection.close();
//   });

//   describe('POST /cards/:boardId/cards - Create a new card', () => {
//     it('should create a new card successfully', async () => {
//       const response = await request(app)
//         .post(`/cards/${boardId}/cards`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           listId,
//           name: 'Test Card',
//           description: 'A card for testing',
//           position: 1,
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.name).toBe('Test Card');
//       expect(response.body.description).toBe('A card for testing');
//       cardId = response.body._id;
//     });

//     it('should fail if required fields are missing', async () => {
//       const response = await request(app)
//         .post(`cards/${boardId}/cards`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           description: 'Missing name and listId',
//           position: 1,
//         });

//       expect(response.status).toBe(400);
//       expect(response.body.errors).toBeDefined();
//     });
//   });

//   describe('GET /cards/:boardId/cards - Get all cards', () => {
//     it('should retrieve all cards in the board', async () => {
//       const response = await request(app)
//         .get(`/cards/${boardId}/cards`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(200);
//       expect(response.body).toBeInstanceOf(Array);
//       expect(response.body.length).toBeGreaterThan(0);
//     });
//   });

//   describe('GET cards/cards/:id - Get a single card by ID', () => {
//     it('should retrieve a single card by its ID', async () => {
//       const response = await request(app)
//         .get(`/cards/cards/${cardId}`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(200);
//       expect(response.body._id).toBe(cardId);
//     });

//     it('should return 404 if the card does not exist', async () => {
//       const response = await request(app)
//         .get(`/cards/cards/invalidCardId`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(404);
//     });
//   });

//   describe('PUT /cards/cards/:id - Update a card', () => {
//     it('should update an existing card', async () => {
//       const response = await request(app)
//         .put(`/cards/cards/${cardId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           name: 'Updated Card',
//           description: 'Updated description',
//           position: 2,
//         });

//       expect(response.status).toBe(200);
//       expect(response.body.name).toBe('Updated Card');
//       expect(response.body.description).toBe('Updated description');
//     });
//   });

//   describe('DELETE /cards/cards/:id - Delete a card', () => {
//     it('should delete an existing card', async () => {
//       const response = await request(app)
//         .delete(`/cards/${cardId}`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe('Card removed');
//     });

//     it('should return 404 if the card does not exist', async () => {
//       const response = await request(app)
//         .delete(`/cards/cards/${cardId}`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(404);
//     });
//   });

//   describe('Card Description', () => {
//     it('should create a card with a detailed description', async () => {
//       const response = await request(app)
//         .post(`/cards/cards/${boardId}/cards`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           listId,
//           name: 'Card with Description',
//           description: 'A comprehensive and detailed description of the card',
//           position: 3,
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.description).toBe('A comprehensive and detailed description of the card');
//     });

//     it('should update a card\'s description', async () => {
//       const createResponse = await request(app)
//         .post(`/cards/cards/${boardId}/cards`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           listId,
//           name: 'Card to Update Description',
//           position: 4,
//         });

//       const cardToUpdateId = createResponse.body._id;

//       const updateResponse = await request(app)
//         .put(`/cards/cards/${cardToUpdateId}`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           description: 'Updated description for testing purposes',
//         });

//       expect(updateResponse.status).toBe(200);
//       expect(updateResponse.body.description).toBe('Updated description for testing purposes');
//     });
//   });

//   describe('Card Comments', () => {
//     let commentId;
//     let cardWithCommentsId;

//     beforeEach(async () => {
//       const createResponse = await request(app)
//         .post(`/cards/cards/${boardId}/cards`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           listId,
//           name: 'Card for Comments',
//           position: 5,
//         });
      
//       cardWithCommentsId = createResponse.body._id;
//     });

//     it('should add a comment to a card', async () => {
//       const response = await request(app)
//         .post(`/cards/cards/${cardWithCommentsId}/comments`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           text: 'This is a test comment',
//         });

//       expect(response.status).toBe(201);
//       expect(response.body.comments[0].text).toBe('This is a test comment');
//       commentId = response.body.comments[0]._id;
//     });

//     it('should delete a comment from a card', async () => {
//       // First, add a comment
//       await request(app)
//         .post(`/cards/cards/${cardWithCommentsId}/comments`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           text: 'Comment to be deleted',
//         });

//       // Then delete the comment
//       const response = await request(app)
//         .delete(`/cards/cards/${cardWithCommentsId}/comments/${commentId}`)
//         .set('Authorization', `Bearer ${token}`);

//       expect(response.status).toBe(200);
//       expect(response.body.message).toBe('Comment removed');
//     });

//     it('should not allow adding an empty comment', async () => {
//       const response = await request(app)
//         .post(`/cards/cards/${cardWithCommentsId}/comments`)
//         .set('Authorization', `Bearer ${token}`)
//         .send({
//           text: '',
//         });

//       expect(response.status).toBe(400);
//     });
//   });


// });