import { UserDocument } from '@/interfaces/users.interface';
import usersModel from '@/models/users.model';
import { logger } from '@/utils/logger';
import { client, SendSMS } from '@utils/twil';
import config from 'config';
import { NextFunction, Request, Response } from 'express';

class VerifyController {
  public send = function VerifyUser(phoneNumber: string) {
    return new Promise((resolve, reject) => {
      client.verify
        .services(config.get('TWILIO_VERIFY_SERVICE_SID'))
        .verifications.create({ to: phoneNumber, channel: 'sms' })
        .then(verification => {
          resolve(verification);
        })
        .catch(err => {
          reject(err);
        });
    });
  };

  public verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const phoneNumber = req.body.phoneNumber;
      const code = req.body.code;
      const verification = await client.verify.services(config.get('TWILIO_VERIFY_SERVICE_SID')).verificationChecks.create({ to: phoneNumber, code });
      if (verification.status === 'approved') {
        logger.info('Verify code is approved');
        // update user isActive to true
        const user: UserDocument = await usersModel.findOneAndUpdate({ phoneNumber: phoneNumber }, { isActive: true });
        console.log(`verifying ${user}`);
        await SendSMS(user);
        console.log(`verifying ${user}`);
        res.json(verification);
      } else {
        res.json(verification);
      }
    } catch (error) {
      next(error);
    }
  };

  public loginVerify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const phoneNumber = req.body.phoneNumber;
      const code = req.body.code;
      const verification = await client.verify.services(config.get('TWILIO_VERIFY_SERVICE_SID')).verificationChecks.create({ to: phoneNumber, code });
      if (verification.status === 'approved') {
        const user: UserDocument = await usersModel.findOne({
          phoneNumber: phoneNumber,
        });
        if (user) {
          res.json(user);
        }
      }
    } catch (error) {
      next(error);
    }
  };
}

export default VerifyController;
