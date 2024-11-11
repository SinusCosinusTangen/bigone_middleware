export interface UserRequest {
    username?: string;
    email?: string;
    password?: string;
    newPassword?: string;
    loginMethod?: string;
    firebaseUid?: string;
    token?: string;
}

export interface AuthDTO {
    usernameEmail?: string;
    password?: string;
    loginMethod?: string;
}

export interface UserDTO {
    uid?: string;
    username?: string;
    email?: string;
    role?: string;
    loginMethod?: string;
    token?: string;
}