import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsValidDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsValidDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const regEx = /^\d{2}-\d{2}-\d{4}$/;

          if (!value || !value.match(regEx)) return false; // Invalid format

          const [month, day, year] = value.split('-');
          const isoDate = `${year}-${month}-${day}`;
          const d = new Date(isoDate);

          return !Number.isNaN(d.getTime());
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date in MM-DD-YYYY format.`;
        },
      },
    });
  };
}
