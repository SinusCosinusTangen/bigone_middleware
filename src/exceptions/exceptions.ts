
export class UserExistsException extends Error {
    constructor(message: string = 'User already exists.') {
        super(message);
        this.name = 'UserExistsException';
    }
}

export class WrongPasswordException extends Error {
    constructor(message: string = 'Wrong password.') {
        super(message);
        this.name = 'WrongPasswordException';
    }
}

export class NotFoundException extends Error {
    constructor(message: string = 'Resource not found.') {
        super(message);
        this.name = 'NotFoundException';
    }
}

export class ExpiredTokenException extends Error {
    constructor(message: string = 'Token expired.') {
        super(message);
        this.name = 'ExpiredTokenException';
    }
}