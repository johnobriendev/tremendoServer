require('dotenv').config();
const request = require('supertest');
const app = require('../../app'); // Your Express app
const mongoose = require('mongoose');
const Board = require('../../models/Board');
const User = require('../../models/User');
const List = require('../../models/List');
const Card = require('../../models/Card');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const setupTestUser = async () => {
  const userData = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: await bcrypt.hash('testpassword', 10),
    isVerified: true // Important: Set this to true for tests
  };
  
  const user = await User.create(userData);
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  
  return { user, token };
};

const createTestBoard = async (userId) => {
  return await Board.create({
    name: 'Test Board',
    owner: userId,
    isPrivate: false,
    description: 'Test Description'
  });
};



// Use a separate test database
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Board Controller', () => {
  let token;
  let user;

  beforeEach(async () => {
    // Clear the database before each test
    await Promise.all([
      Board.deleteMany({}),
      User.deleteMany({}),
      List.deleteMany({}),
      Card.deleteMany({})
    ]);

    // Create a test user and get the token
    const testData = await setupTestUser();
    user = testData.user;
    token = testData.token;
  });

  describe('GET /boards', () => {
    it('should retrieve all boards for the authenticated user', async () => {
      // Create test boards
      await Promise.all([
        Board.create({ name: 'Board 1', owner: user._id, isPrivate: false }),
        Board.create({ name: 'Board 2', owner: user._id, isPrivate: true })
      ]);

      const res = await request(app)
        .get('/boards')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('owner');
      expect(res.body[0].owner.toString()).toBe(user._id.toString());
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/boards');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /boards', () => {
    it('should create a new board with valid data', async () => {
      const boardData = {
        name: 'New Board',
        description: 'This is a new board',
        isPrivate: true,
        backgroundColor: '#ffffff',
        template: 'kanban',
      };

      const res = await request(app)
        .post('/boards')
        .set('Authorization', `Bearer ${token}`)
        .send(boardData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(boardData.name);
      expect(res.body.owner.toString()).toBe(user._id.toString());

      // Verify board was saved to database
      const savedBoard = await Board.findById(res.body._id);
      expect(savedBoard).toBeTruthy();
      expect(savedBoard.name).toBe(boardData.name);
    });
  });

  describe('GET /boards/:id', () => {
    it('should retrieve a specific board by ID', async () => {
      const board = await createTestBoard(user._id);

      const res = await request(app)
        .get(`/boards/${board._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body._id.toString()).toBe(board._id.toString());
      expect(res.body.owner.toString()).toBe(user._id.toString());
    });
  });

  describe('PUT /boards/:id', () => {
    it('should update a board with valid data', async () => {
      const board = await Board.create({
        name: 'Board to Update',
        owner: user._id,
        isPrivate: false,
      });

      const res = await request(app)
        .put(`/boards/${board._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Board Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Board Name');
    });

    it('should return 404 if board to update is not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/boards/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Non-existent Board' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Board not found');
    });
  });

  describe('DELETE /boards/:id', () => {
    it('should delete a board and associated lists and cards', async () => {
      const board = await Board.create({
        name: 'Board to Delete',
        owner: user._id,
        isPrivate: false,
      });

      const list = await List.create({
        name: 'List in Board',
        boardId: board._id,
        position: 0, 
        color: '#ffffff',
      });

      await Card.create({ 
        name: 'Card in List', 
        listId: list._id,
        boardId: board._id, 
        position: 0, 
      });

      const res = await request(app)
        .delete(`/boards/${board._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Board deleted successfully');

      // Check that lists and cards were deleted
      const deletedList = await List.findById(list._id);
      const deletedCard = await Card.findOne({ listId: list._id });

      expect(deletedList).toBeNull();
      expect(deletedCard).toBeNull();
    });

    it('should return 404 if board to delete is not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/boards/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Board not found');
    });
  });
});
