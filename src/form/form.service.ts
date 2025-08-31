import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateFormDto,
  CreatePreSignedUrlDto,
  UpdateSettingDto,
} from './form.dto';
import { FormRepository } from './../app/repositories/form/form.repository';
import { FormSchemaModel } from '@/app/models/schema/formSchema.model';
import { S3Service } from '@/app/commons/s3.service';
import { ServiceTypeCategoryRepository } from './../app/repositories/serviceType/serviceTypeCategory.repository';
import { SettingRepository } from '@/app/repositories/setting/setting.repository';
import { SettingModel } from '@/app/models/setting/setting.model';

@Injectable()
export class FormService {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly s3Service: S3Service,
    private readonly serviceTypeCategoryRepository: ServiceTypeCategoryRepository,
    private readonly settingRepository: SettingRepository,
  ) {}

  async upsertForm(payload: CreateFormDto): Promise<FormSchemaModel> {
    let form = await this.formRepository.findOne({
      where: { type: payload.type },
    });

    if (form) {
      form.schema = payload.schema;
      await this.formRepository.save(form);
    } else {
      form = this.formRepository.create(payload);
      form = await this.formRepository.save(form);
    }

    return form;
  }

  async mappingFields<T = any>(type: string): Promise<T | void> {
    switch (type) {
      case 'service_categories':
        return (await this.serviceTypeCategoryRepository.getAllCategoriesForFormBuilder()) as unknown as T;

      default:
        // Optional: Handle unknown types
        return undefined;
    }
  }

  sortPropertiesByPosition(schema: any) {
    const propertiesArray = Object.entries(schema.properties) as [
      string,
      { position: number },
    ][];
    propertiesArray.sort(([, a], [, b]) => a.position - b.position);
    const sortedProperties = Object.fromEntries(propertiesArray);
    return {
      ...schema,
      properties: sortedProperties,
    };
  }

  async getFormByType(type: string): Promise<FormSchemaModel> {
    const form: any = await this.formRepository.findOne({
      where: { type, is_deleted: false },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const { schema } = form;
    const sortedSchema = this.sortPropertiesByPosition(schema);
    form.schema = sortedSchema;

    return form;
  }

  async deleteForm(formId: number): Promise<void> {
    await this.formRepository.delete({ id: formId });
  }

  async getPresignedUrls(payload: CreatePreSignedUrlDto): Promise<
    Array<{
      url: string;
      mime_type: string;
      key: string;
      new_file_name: string;
    }>
  > {
    return await Promise.all(
      payload.images.map(
        async (image) => await this.s3Service.getPreSignedURL(image),
      ),
    );
  }

  async updateSetting(payload: UpdateSettingDto): Promise<boolean> {
    payload.settings.forEach(async (setting) => {
      const settingModel: SettingModel = await this.settingRepository.findOne({
        where: {
          key: setting.key,
        },
      });

      if (!settingModel) {
        const setModel = new SettingModel();
        setModel.key = setting.key;
        setModel.value = setting.value;
        await this.settingRepository.save(setModel);
      } else {
        await this.settingRepository.update(
          { key: setting.key },
          { value: setting.value },
        );
      }
    });

    return true;
  }

  async getSetting(key: string = null): Promise<SettingModel[] | SettingModel> {
    return key
      ? await this.settingRepository.findOne({
          where: {
            is_deleted: false,
            ...(key && { key }),
          },
        })
      : await this.settingRepository.find({
          is_deleted: false,
          ...(key && { key }),
        });
  }
}
