const request = require('supertest');
const app = require('../../app'); // Your Express app
const mongoose = require('mongoose');
const Board = require('../../models/Board');
const User = require('../../models/User');
const List = require('../../models/List');
const Card = require('../../models/Card');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use a separate test database
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe('Board Controller', () => {
  let token;
  let user;

  beforeEach(async () => {
    // Clear the database before each test
    await Board.deleteMany({});
    await User.deleteMany({});
    await List.deleteMany({});
    await Card.deleteMany({});

    // Create a user for testing and generate a token
    user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: await bcrypt.hash('testpassword', 10),
    });

    token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  });

  describe('GET /boards', () => {
    it('should retrieve all boards for the authenticated user', async () => {
      // Create test boards
      await Board.create([
        { name: 'Board 1', owner: user._id, isPrivate: false },
        { name: 'Board 2', owner: user._id, isPrivate: true },
      ]);

      const res = await request(app)
        .get('/boards')
        .set('Authorization', `Bearer ${token}`); // Send token for authentication

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('Board 1');
    });
  });

  describe('POST /boards', () => {
    it('should create a new board with valid data', async () => {
      const res = await request(app)
        .post('/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Board',
          description: 'This is a new board',
          isPrivate: true,
          backgroundColor: '#ffffff',
          template: 'kanban',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('New Board');

      // Check that the lists were created according to the template
      const lists = await List.find({ boardId: res.body._id });
      expect(lists).toHaveLength(3); // 'To Do', 'In Progress', 'Done'
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Missing name and isPrivate fields',
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /boards/:id', () => {
    it('should retrieve a specific board by ID', async () => {
      const board = await Board.create({
        name: 'Board to Get',
        owner: user._id,
        isPrivate: false,
      });

      const res = await request(app)
        .get(`/boards/${board._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Board to Get');
    });

    it('should return 404 if board is not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/boards/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Board not found');
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
      });

      await Card.create({ name: 'Card in List', listId: list._id });

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
