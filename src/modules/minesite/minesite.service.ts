import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { CreateMineSiteDTO } from 'src/common/dtos/create-minesite.dto';
import { ApiResponse } from 'src/common/payload/ApiResponse';
import { MineSite } from 'src/entities/minesite.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MinesiteService {
  constructor(
    @InjectRepository(MineSite)
    public minesiteRepository: Repository<MineSite>,
  ) {}

  async create(dto: CreateMineSiteDTO): Promise<ApiResponse> {
    if (await this.existsByCode(dto.code))
      throw new BadRequestException(
        'The minesite with the provided Id is already registered',
      );
    const minesite = new MineSite(
      dto.name,
      dto.code,
      dto.province,
      dto.district,
    );
    const createdMinesite = await this.minesiteRepository.save(minesite);
    return new ApiResponse(
      true,
      'The minesite was created successfully',
      createdMinesite,
    );
  }
  async update(id: UUID, dto: CreateMineSiteDTO): Promise<ApiResponse> {
    if (!(await this.existsById(id)))
      throw new BadRequestException(
        'The minesite with the provided id is not found',
      );
    const minesiteEntity: MineSite = await this.getById(id);
    minesiteEntity.code = dto.code;
    minesiteEntity.name = dto.name;
    minesiteEntity.province = dto.province;
    minesiteEntity.district = dto.district;
    const updatedMinesite = await this.minesiteRepository.save(minesiteEntity);
    return new ApiResponse(
      true,
      'The minesite was updated successfully',
      updatedMinesite,
    );
  }
  async getById(id: UUID) {
    const mineSite = await this.minesiteRepository.findOne({
      where: { id: id },
    });
    if (!mineSite)
      throw new NotFoundException(
        'The mine site with the provided id is not found',
      );
    return mineSite;
  }

  async getAll() {
    const minesites: MineSite[] = await this.minesiteRepository.find({});
    return new ApiResponse(
      true,
      'All minsites were retrieved successfully',
      minesites,
    );
  }
  async findById(id: UUID) {
    const minesite = await this.minesiteRepository.findOne({
      where: { id: id },
    });
    if (!minesite)
      throw new NotFoundException(
        'The minesite with the provided Id is not found',
      );
    return minesite;
  }
  async findByCode(code: string) {
    const minesite = await this.minesiteRepository.findOne({
      where: { code: code },
    });
    if (!minesite)
      throw new NotFoundException(
        'The minesite with the provided code is not found',
      );
    return minesite;
  }
  async existsById(id: UUID): Promise<boolean> {
    const isAvailable = await this.minesiteRepository.findOne({
      where: { id: id },
    });
    return isAvailable != null;
  }
  async existsByCode(code: string): Promise<boolean> {
    const isAvailable = await this.minesiteRepository.findOne({
      where: { code: code },
    });
    return isAvailable != null;
  }
}
