import { UserRequest, AuthDTO, UserDTO } from '../models/AuthDTO';
import { CryptoDTO } from '../models/CryptoDTO';

export interface IAuthService {
    getEncryptedPassword(password: string): Promise<string>;
    getPublicKey(): Promise<CryptoDTO>;
    registerUser(request: UserRequest): Promise<UserDTO>;
    loginUser(request: AuthDTO): Promise<UserDTO>;
    updateUser(request: UserRequest): Promise<UserDTO>;
    deleteUser(request: UserRequest): Promise<void>;
    validateToken(user: UserDTO): Promise<UserDTO>;
    logoutUser(user: UserDTO): Promise<number>;
    authWithGoogle(request: UserRequest): Promise<UserDTO>;
    validateGoogleUser(request: UserDTO): Promise<UserDTO>;
}
