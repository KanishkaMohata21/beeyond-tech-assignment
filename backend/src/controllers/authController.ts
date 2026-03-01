import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const generateAccessToken = (userId: string): string => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
        expiresIn: '15m',
    });
};

const generateRefreshToken = (userId: string): string => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
    });
};

// POST /register
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({ message: 'Email already registered.' });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        res.status(201).json({
            message: 'User registered successfully.',
            user: {
                id: user._id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// POST /login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required.' });
            return;
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password.' });
            return;
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());

        // Store refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            message: 'Login successful.',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// POST /refresh-token
export const refreshToken = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            res.status(400).json({ message: 'Refresh token is required.' });
            return;
        }

        // Verify refresh token
        let decoded: { id: string };
        try {
            decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
                id: string;
            };
        } catch {
            res.status(401).json({ message: 'Invalid or expired refresh token.' });
            return;
        }

        // Find user and validate stored refresh token
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== token) {
            res.status(401).json({ message: 'Invalid refresh token.' });
            return;
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user._id.toString());

        // Optionally rotate refresh token
        const newRefreshToken = generateRefreshToken(user._id.toString());
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// GET /me
export const getProfile = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const user = await User.findById(req.user!.id).select('-password -refreshToken');
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
