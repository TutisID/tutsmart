import { IAPIData } from '@/interfaces/api.interface';
import bcrypt from 'bcrypt';
import Coinkey from 'coinkey';
import { DataTypes, Model, Sequelize, UUIDV4 } from 'sequelize';
import { sign } from 'jsonwebtoken';
import { SECRET_KEY } from '@/config';
import { DataStoredInToken } from '@/interfaces/auth.interface';

const WALLET = new Coinkey.createRandom();

class APIData extends Model implements IAPIData {
  public id: string;
  public userId: string;
  public apiKey: string;
  public apiSecret: string;

  public async generateAPIData(): Promise<void> {
    this.apiKey = await this.generateAPIKey();
    this.apiSecret = await this.generateAPISecret();
  }

  public async revokeAPIData(): Promise<void> {
    this.apiKey = null;
    this.apiSecret = null;
    await this.save();
  }

  public async checkAPIData(key: string, secret: string): Promise<boolean> {
    const compareKey = await bcrypt.compare(key, this.apiKey);
    const compareSecret = await bcrypt.compare(secret, this.apiSecret);
    return compareKey && compareSecret;
  }

  public async generateAPIKey(): Promise<string> {
    const dataStoredInToken: DataStoredInToken = { id: this.userId as unknown as number, expiresIn: Number.MAX_VALUE, type: 'API-key' };
    const secretKey: string = SECRET_KEY;
    const key = sign(dataStoredInToken, secretKey);
    return `TUT${key}`;
  }

  public async generateAPISecret(): Promise<string> {
    const apiSecret = WALLET.privateKey.toString('hex') + WALLET.publicKey.toString('hex');
    return await bcrypt.hash(apiSecret, 10);
  }
}

export default function (sequelize: Sequelize): typeof APIData {
  APIData.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: UUIDV4(),
      },
      apiKey: {
        allowNull: false,
        type: DataTypes.STRING(45),
      },
      apiSecret: {
        allowNull: false,
        type: DataTypes.STRING(255),
      },
      userId: {
        allowNull: false,
        type: DataTypes.STRING(45),
      },
    },
    {
      tableName: 'api_Keys',
      sequelize,
      timestamps: true,
      paranoid: true,
    },
  );

  return APIData;
}
