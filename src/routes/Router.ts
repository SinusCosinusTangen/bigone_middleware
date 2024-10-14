import express, { Router } from 'express';
import { getPublicKey, encrypt, registerUser, loginUser, updateUser, deleteUser, validateUser } from '../controllers/AuthController';

const router: Router = express.Router();

// Routes for the auth controller
router.get('/', getPublicKey);                      // GET: /api/auth
router.get('/encrypt/:param', encrypt);             // POST: /api/auth/encrypt
router.post('/register', registerUser);             // POST: /api/auth/register
router.post('/login', loginUser);                   // POST: /api/auth/login
router.put('/update-user', updateUser);             // PUT: /api/auth/update-user
router.post('/validate', validateUser);             // POST: /api/auth/validate

export default router;
