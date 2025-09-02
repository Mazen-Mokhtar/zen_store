import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../enums/payment-method.enum';
import { OrderRepository } from 'src/DB/models/Order/order.repository';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'isFawryTransferValidation', async: true })
@Injectable()
export class IsFawryTransferValidationConstraint implements ValidatorConstraintInterface {
    constructor(private readonly orderRepository: OrderRepository) {}

    async validate(walletTransferNumber: string, args: ValidationArguments) {
        const { orderId } = args.object as any;
        console.log('IsFawryTransferValidation: orderId', orderId);

        if (!orderId) {
            console.log('IsFawryTransferValidation: orderId is missing');
            return false; // orderId is required
        }

        const order = await this.orderRepository.findOne({ 
            _id: orderId, 
            isDeleted: { $ne: true } 
        });
        console.log('IsFawryTransferValidation: order', order);
        if (!order) {
            console.log('IsFawryTransferValidation: Order not found for orderId', orderId);
            return false; // Order not found
        }

        console.log('IsFawryTransferValidation: order.paymentMethod', order.paymentMethod);
        console.log('IsFawryTransferValidation: walletTransferNumber', walletTransferNumber);

        if (order.paymentMethod === PaymentMethod.FAWRY_TRANSFER) {
            // Fawry transfer requires walletTransferNumber with specific validation
            if (!walletTransferNumber || walletTransferNumber.trim().length === 0) {
                console.log('IsFawryTransferValidation: walletTransferNumber is empty');
                return false;
            }

            // Validate that it contains only digits
            if (!/^[0-9]+$/.test(walletTransferNumber)) {
                console.log('IsFawryTransferValidation: walletTransferNumber contains non-digits');
                return false;
            }

            // Validate length (minimum 3 digits, maximum 20 digits)
            if (walletTransferNumber.length < 3 || walletTransferNumber.length > 20) {
                console.log('IsFawryTransferValidation: walletTransferNumber length is invalid');
                return false;
            }

            console.log('IsFawryTransferValidation: is FAWRY_TRANSFER, validation passed');
            return true;
        } else if (order.paymentMethod === PaymentMethod.WALLET_TRANSFER) {
            // Regular wallet transfer also requires walletTransferNumber with same validation
            if (!walletTransferNumber || walletTransferNumber.trim().length === 0) {
                console.log('IsFawryTransferValidation: walletTransferNumber is empty for WALLET_TRANSFER');
                return false;
            }

            // Validate that it contains only digits
            if (!/^[0-9]+$/.test(walletTransferNumber)) {
                console.log('IsFawryTransferValidation: walletTransferNumber contains non-digits for WALLET_TRANSFER');
                return false;
            }

            // Validate length (minimum 3 digits, maximum 20 digits)
            if (walletTransferNumber.length < 3 || walletTransferNumber.length > 20) {
                console.log('IsFawryTransferValidation: walletTransferNumber length is invalid for WALLET_TRANSFER');
                return false;
            }

            console.log('IsFawryTransferValidation: is WALLET_TRANSFER, validation passed');
            return true;
        } else {
            // Other payment methods should not have walletTransferNumber
            const isValid = !walletTransferNumber;
            console.log('IsFawryTransferValidation: is NOT wallet transfer, isValid', isValid);
            return isValid;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return 'Wallet transfer number must be digits only (3-20 characters) for wallet/fawry transfer payment methods and should not be provided for other payment methods';
    }
}

export function IsFawryTransferValidation(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsFawryTransferValidationConstraint,
        });
    };
}