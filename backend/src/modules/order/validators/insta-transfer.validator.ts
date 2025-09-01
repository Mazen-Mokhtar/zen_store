import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../enums/payment-method.enum';
import { OrderRepository } from 'src/DB/models/Order/order.repository';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'isInstaTransferValidation', async: true })
@Injectable()
export class IsInstaTransferValidationConstraint implements ValidatorConstraintInterface {
    constructor(private readonly orderRepository: OrderRepository) {}

    async validate(nameOfInsta: string, args: ValidationArguments) {
        const { orderId } = args.object as any;
        console.log('IsInstaTransferValidation: orderId', orderId);

        if (!orderId) {
            console.log('IsInstaTransferValidation: orderId is missing');
            return false; // orderId is required
        }

        const order = await this.orderRepository.findOne({ 
            _id: orderId, 
            isDeleted: { $ne: true } 
        });
        console.log('IsInstaTransferValidation: order', order);
        if (!order) {
            console.log('IsInstaTransferValidation: Order not found for orderId', orderId);
            return false; // Order not found
        }

        console.log('IsInstaTransferValidation: order.paymentMethod', order.paymentMethod);
        console.log('IsInstaTransferValidation: nameOfInsta', nameOfInsta);

        if (order.paymentMethod === PaymentMethod.INSTA_TRANSFER) {
            // Insta transfer requires nameOfInsta
            const isValid = !!nameOfInsta && nameOfInsta.trim().length > 0;
            console.log('IsInstaTransferValidation: is INSTA_TRANSFER, isValid', isValid);
            return isValid;
        } else {
            // Other payment methods should not have nameOfInsta
            const isValid = !nameOfInsta;
            console.log('IsInstaTransferValidation: is NOT INSTA_TRANSFER, isValid', isValid);
            return isValid;
        }
    }

    defaultMessage(args: ValidationArguments) {
        return 'Instagram name is required for insta-transfer payment method and should not be provided for other payment methods';
    }
}

export function IsInstaTransferValidation(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsInstaTransferValidationConstraint,
        });
    };
}