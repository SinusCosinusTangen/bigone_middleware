import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/Database';

interface UserAttributes {
    id: string;
    email: string;
    username: string;
    password?: string;
    role: string;
    loginMethod: string;
    lastLoggedOn?: Date;
    firebaseUid?: string;
    createdDate: Date;
    lastModified: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'lastLoggedOn' | 'createdDate' | 'lastModified'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public email!: string;
    public username!: string;
    public password?: string;
    public role!: string;
    public loginMethod!: string;
    public lastLoggedOn?: Date;
    public firebaseUid?: string;
    public createdDate!: Date;
    public lastModified!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        role: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        loginMethod: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: "login_method",
        },
        lastLoggedOn: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "last_logged_on",
        },
        firebaseUid: {
            type: DataTypes.STRING(30),
            allowNull: true,
            field: "firebase_uid",
        },
        createdDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: "created_date",
        },
        lastModified: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: "last_modified",
        },
    },
    {
        sequelize,
        tableName: 'user_auth',
        timestamps: false,
    }
);

export default User;
