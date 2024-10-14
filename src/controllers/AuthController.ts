import { NextFunction, Request, Response } from 'express';
import { IAuthService } from '../services/IAuthService';
import { AuthService } from '../services/AuthService';
import { ApiConstant } from '../constants/ApiConstant';
import { UserRequest, AuthDTO, UserDTO } from '../models/AuthDTO';
import { CryptoDTO } from '../models/CryptoDTO';
import { UserExistsException, WrongPasswordException, NotFoundException } from '../exceptions/exceptions';
import { ICryptoService } from '../services/ICryptoService';
import { CryptoService } from '../services/CryptoService';

const cryptoService: ICryptoService = new CryptoService();
const authService: IAuthService = new AuthService(cryptoService);

export const getPublicKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cryptoDTO: CryptoDTO = await authService.getPublicKey();
        res.status(200).json({
            status: ApiConstant.OK,
            message: ApiConstant.OK_MESSAGE,
            data: cryptoDTO
        });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while fetching the public key.' });
    }
};

export const encrypt = async (req: Request, res: Response) => {
    const request = req.params.param;
    try {
        const encryptedText: string = await authService.getEncryptedPassword(request);
        res.status(200).json({
            status: ApiConstant.OK,
            message: ApiConstant.OK_MESSAGE,
            data: encryptedText
        });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while encrypting the data.' });
    }
};

export const registerUser = async (req: Request, res: Response) => {
    const requestData: UserRequest = req.body;
    try {
        const createdUser = await authService.registerUser(requestData);
        res.status(201).json({
            status: ApiConstant.CREATED,
            message: ApiConstant.CREATED_MESSAGE,
            data: createdUser
        });
    } catch (error) {
        if (error instanceof UserExistsException) {
            res.status(200).json({
                status: ApiConstant.OK,
                message: ApiConstant.OK_MESSAGE,
                data: "USER ALREADY EXISTS"
            });
        } else if (error instanceof Error && error.message === "PASSWORD IS EMPTY") {
            res.status(400).json({
                status: ApiConstant.BAD_REQUEST,
                message: ApiConstant.BAD_REQUEST_MESSAGE,
                data: "PASSWORD IS EMPTY"
            });
        } else {
            res.status(400).json({
                status: ApiConstant.BAD_REQUEST,
                message: ApiConstant.BAD_REQUEST_MESSAGE,
                data: "USERNAME OR EMAIL IS EMPTY"
            });
        }
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const requestData: AuthDTO = req.body;
    try {
        const user: UserDTO = await authService.loginUser(requestData);
        res.status(200).json({
            status: ApiConstant.OK,
            message: ApiConstant.OK_MESSAGE,
            data: user
        });
    } catch (error) {
        if (error instanceof WrongPasswordException) {
            res.status(401).json({
                status: ApiConstant.UNAUTHORIZED,
                message: ApiConstant.UNAUTHORIZED_MESSAGE,
                data: "WRONG PASSWORD"
            });
        } else if (error instanceof NotFoundException) {
            res.status(404).json({
                status: ApiConstant.NOT_FOUND,
                message: ApiConstant.NOT_FOUND_MESSAGE,
                data: "USER NOT FOUND"
            });
        } else {
            throw error;
        }
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const requestData: UserRequest = req.body;
    try {
        const updatedUser = await authService.updateUser(requestData);
        res.status(200).json({
            status: ApiConstant.OK,
            message: ApiConstant.OK_MESSAGE,
            data: updatedUser
        });
    } catch (error) {
        if (error instanceof WrongPasswordException) {
            res.status(401).json({
                status: ApiConstant.UNAUTHORIZED,
                message: ApiConstant.UNAUTHORIZED_MESSAGE,
                data: "WRONG PASSWORD"
            });
        } else if (error instanceof NotFoundException) {
            res.status(404).json({
                status: ApiConstant.NOT_FOUND,
                message: ApiConstant.NOT_FOUND_MESSAGE,
                data: "USER NOT FOUND"
            });
        } else {
            res.status(500).json({ message: 'An error occurred while updating the user.' });
        }
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const requestData: UserRequest = req.body;
    try {
        await authService.deleteUser(requestData);
        res.status(204).send();
    } catch (error) {
        if (error instanceof WrongPasswordException) {
            res.status(401).json({
                status: ApiConstant.UNAUTHORIZED,
                message: ApiConstant.UNAUTHORIZED_MESSAGE,
                data: "WRONG PASSWORD"
            });
        } else if (error instanceof NotFoundException) {
            res.status(404).json({
                status: ApiConstant.NOT_FOUND,
                message: ApiConstant.NOT_FOUND_MESSAGE,
                data: "USER NOT FOUND"
            });
        } else {
            res.status(500).json({ message: 'An error occurred while deleting the user.' });
        }
    }
};

export const validateUser = async (req: Request, res: Response) => {
    const requestData: UserRequest = req.body;
    try {
        const validatedUser = await authService.validateToken(requestData);
        if (validatedUser.token !== "EXPIRED") {
            res.status(200).json({
                status: ApiConstant.OK,
                message: ApiConstant.OK_MESSAGE,
                data: validatedUser
            });
        } else {
            res.status(401).json({
                status: ApiConstant.UNAUTHORIZED,
                message: ApiConstant.UNAUTHORIZED_MESSAGE,
                data: validatedUser
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while validating the user.' });
        throw error;
    }
};