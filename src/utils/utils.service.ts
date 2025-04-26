import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { CreateInspectionDTO } from 'src/common/dtos/inspections/create-inspection.dto';
import { InspectionsResponseDTO } from 'src/common/dtos/responses/inspections-response.dto';
import { EGender } from 'src/common/Enum/EGender.enum';
import { EInspectionStatus } from 'src/common/Enum/EInspectionStatus.enum';
import { EInspectorRole } from 'src/common/Enum/EInspectorRole.enum';
import { ERole } from 'src/common/Enum/ERole.enum';
import { Category } from 'src/entities/category.entity';
import { InspectionIdentification } from 'src/entities/inspection-identification.entity';
import { InspectionRecord } from 'src/entities/inspection-record.entity';
import { Profile } from 'src/entities/profile.entity';
import { Role } from 'src/entities/role.entity';
import { SummaryReport } from 'src/entities/summary-report.entity';
import { RoleService } from 'src/modules/roles/roles.service';
import { UsersService } from 'src/modules/users/users.service';
import { RecordedValues, RedFlagInformation } from './appData/constants';

@Injectable()
export class UtilsService {
  constructor(
    private config: ConfigService,
    private jwt: JwtService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
    private roleService: RoleService,
  ) {}

  async getTokens(
    user: Profile,
  ): Promise<{ accessToken: String; refreshToken: String }> {
    const accessToken: String = await this.jwt.signAsync(
      { roles: user.roles, email: user.email },
      {
        expiresIn: '3h',
        secret: this.config.get('SECRET_KEY'),
      },
    );
    const refreshToken: String = await this.jwt.signAsync(
      { roles: user.roles, email: user.email },
      {
        expiresIn: '3d',
        secret: this.config.get('SECRET_KEY'),
      },
    );

    return {
      accessToken: accessToken.toString(),
      refreshToken: refreshToken.toString(),
    };
  }
  async hashString(input) {
    try {
      if (typeof input !== 'string') {
        throw new Error('Input must be a string');
      }
      const hash = await bcrypt.hash(input, 10);
      return hash;
    } catch (error) {
      console.error('Error occurred while hashing:', error.message);
    }
  }

  async getLoggedInProfile(req: Request) {
    const authorization = req.headers.authorization;
    if (authorization) {
      const token = authorization.split(' ')[1];
      if (!authorization.toString().startsWith('Bearer '))
        throw new UnauthorizedException('The provided token is invalid');
      const { tokenVerified, error } = this.jwt.verify(token, {
        secret: this.config.get('SECRET_KEY'),
      });
      if (error)
        throw new BadRequestException(
          'Errow accured while getting the profile ' + error.message,
        );
      const details: any = await this.jwt.decode(token);
      return await this.userService.getOneByEmail(details.email);
    } else {
      throw new UnauthorizedException(
        'Please you are not authorized to access resource',
      );
    }
  }
  async getRole(role: string): Promise<Role> {
    let availableRole: Role;
    switch (role.toLowerCase()) {
      case 'inspector':
        availableRole = await this.roleService.getRoleByName(
          ERole[ERole.INSPECTOR],
        );
        break;
      case 'rmb':
        availableRole = await this.roleService.getRoleByName(ERole[ERole.RMB]);
        break;
      case 'environomist':
        availableRole = await this.roleService.getRoleByName(
          ERole[ERole.ENVIRONOMIST],
        );
        break;
      case 'superviosr':
        availableRole = await this.roleService.getRoleByName(
          ERole[ERole.SUPERVISOR],
        );
        break;
      default:
        throw new BadRequestException('The provided role is invalid');
    }
    return availableRole;
  }

  getGender(gender: string): string {
    switch (gender.toLowerCase()) {
      case 'male':
        return EGender[EGender.MALE];
      case 'female':
        return EGender[EGender.FEMALE];
      default:
        throw new BadRequestException(
          'The provided gender is invalid, should male or female',
        );
    }
  }

  getInspectionStatus(inspectionStatus: string): EInspectionStatus {
    switch (inspectionStatus.toLowerCase()) {
      case 'submitted':
        return EInspectionStatus.SUBMITTED;
      case 'concluded':
        return EInspectionStatus.CONCLUDED;
      case 'reviewed':
        return EInspectionStatus.REVIEWED;
      default:
        throw new BadRequestException(
          'The provided inspection status is invalid, should be in  [ submitted, concluded, reviewed]',
        );
    }
  }
  getRecordRank(flag: string): number {
    switch (flag.toLowerCase()) {
      case 'red':
        return 40;
      case 'green':
        92;
      case 'yellow':
        return 0;
    }
  }
  getInspectorRole(role: string): string {
    switch (role.toLowerCase()) {
      case 'inspector':
        return EInspectorRole[EInspectorRole.INSPECTOR];
      case 'environmentalist':
        return EInspectorRole[EInspectorRole.ENVIRONMENTALIST];
      case 'supervisor':
        return EInspectorRole[EInspectorRole.INSPECTOR];
      default:
        throw new BadRequestException(
          'The provided role is invalid, should be in [ inspector, environmentalist, supervisor]',
        );
    }
  }

  getIdentificationIdentity(
    dto: CreateInspectionDTO,
  ): InspectionIdentification {
    return new InspectionIdentification(
      dto.identification.mineOwner,
      dto.identification.mineOperator,
      dto.identification.licenseNumber,
      dto.identification.mainBuyers,
      dto.identification.licenseCategory,
      dto.identification.licenseIssueDate,
      dto.identification.licenseExpirationDate,
      dto.identification.province,
      dto.identification.district,
      dto.identification.sector,
      dto.identification.cell,
      dto.identification.responsiblePersonNames,
      dto.identification.responsiblePersonTitle,
      dto.identification.responsiblePersonContact,
    );
  }
  getSummaryReportEntity(dto: CreateInspectionDTO) {
    return new SummaryReport(
      dto.summaryReport.mainProblems,
      dto.summaryReport.proposedRemedialActions,
      dto.summaryReport.certificationStatus,
    );
  }

  rankInspectionRecord(
    inspectionRecord: InspectionRecord,
    category: Category,
  ): InspectionRecord {
    if (
      inspectionRecord.boxValue == 'yes' &&
      category.section.flagStandard.toUpperCase() == 'RED'
    ) {
      inspectionRecord.flagValue = 'RED';
    } else if (
      inspectionRecord.boxValue == 'yes' &&
      category.section.flagStandard.toUpperCase() == 'YELLOW'
    ) {
      inspectionRecord.flagValue = 'YELLOW';
    } else {
      inspectionRecord.flagValue = 'NO';
    }
    return inspectionRecord;
  }
  paginator({ page, limit, total }: any) {
    const lastPage = Math.ceil(total / limit);

    return {
      total,
      lastPage,
      currentPage: page,
      perPage: limit,
      prev: page > 1 ? page - 1 : null,
      next: page < lastPage ? page + 1 : null,
    };
  }
  getRedFlabValues(report: InspectionsResponseDTO): RedFlagInformation {
    let redFlagInfo: RedFlagInformation = new RedFlagInformation();
    report.records.forEach((category: Category) => {
      if (category.section?.flagStandard == 'RED') {
        category.records.forEach((record: InspectionRecord) => {
          switch (record.pseudoName) {
            case 'non-state-armed-groups-or-their-affiliates-illegally-control-mine-site':
              redFlagInfo.ArmedGroupsPresent = record.boxValue
                ? record.boxValue
                : record.flagValue;
              break;
            case 'children-below-the-minimum-working-age-as-defined-in-rwanda--16-years--are-employed-in-exploitation-at-the-mine-site':
              redFlagInfo.ChildrenPresent = record.boxValue
                ? record.boxValue
                : record.flagValue;
              break;
            case 'forced-labor-is-practiced-on-the-mine-site':
              redFlagInfo.ForcedLabor = record.boxValue
                ? record.boxValue
                : record.flagValue;
              break;
            case 'security-staff-are-sensitized-to-prevent-report-influx-of-external-minerals-on-mine-sites':
              redFlagInfo.ForeignMinerals = record.boxValue
                ? record.boxValue
                : record.flagValue;
              break;
            default:
              redFlagInfo = redFlagInfo;
          }
        });
      }
    });
    return redFlagInfo;
  }

  getOtherFlabValues(report: InspectionsResponseDTO): RecordedValues {
    let data: RecordedValues = new RecordedValues();
    report.records.forEach((category: Category) => {
      // if (category.section?.flagStandard == 'RED') {
      category.records.forEach((record: InspectionRecord) => {
        switch (record.pseudoName) {
          case 'afp-sampling-has-already-taken-place':
            data.SamplingTookPlace = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'ppe-specify':
            data.PPEAvailable = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'health---safety':
            data.SafetyAtOperatingSite = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'comments---action-15':
            data.Wayforwardcomment = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'proposed-remedial-actions':
            // TOFO
            data.EnvironmentalStatus = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'mine-site-certification-status--based-on-the-next-pages':
            data.CurrentstatusOfMinesite = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'date-of-last-inspection':
            data.DateOfLastInspection = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'next-inspection-date':
            data.NextInspectionDate = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'inspectorInfo.name':
            data.ResponsibleOfLastMine = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'reference-of-last-inspection-report':
            data.LastMineInspection = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'inspectorInfo.name':
            data.ResponsibleOfLastMine = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'main-problem-at-mine-site':
            data.InspectionComments = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'data-source':
            data.ProductionHistory = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'large-open-pit-abandoned':
            data.NumberOfLargeOpenPitAbandoned = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'small-open-pit-abandoned':
            data.NumberOfSmallOpenPitAbandoned = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'underground-tunnels-active':
            data.NumberOfUndergroundActive = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'underground-tunnels-abandoned':
            data.NumberOfUndergroundAbandoned = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'small-open-pit-active':
            data.NumberOfSmallOpenPitActive = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'large-open-pit-active':
            data.NumberOfLargeOpenPitActive = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'exploitation-begun':
            data.ExploitationBegun = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'mine-site-classification':
            data.ICGLRClassification = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'enter-permit-type':
            data.MineralLicenseType = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'permit-number--ministerial-decree-no':
            data.LicenseNumber = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'date-issued':
            data.IssuedDate = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'expiry-date':
            data.ExpiryDate = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'surface-area-ha':
            data.SurfaceArea = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'id-of-responsible-operations-manager':
            data.OperatorNID = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'headquarters-address':
            data.operatorAddress = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'telephone-number-2':
            data.ContactNumber = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'name-of-responsible-operations-manager':
            data.ContactName = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'parameters':
            data.ExpiryDate = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'subsites':
            data.Subsites = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'type-of-mine':
            data.NumberOfMine = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'mine-activity-status':
            data.MiningActivityStatus = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'all-mine-workers--f-m':
            data.NumberOfWorkers = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'average-production-per-miner-per-day':
            data.AverageProducation = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'typical-depth-of-pits-or-tunnels--m---special-range':
            data.AverageRepresentative = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'monthly-capacity-specify-range':
            data.MineSiteMonthly = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'specify-order-of-economic-importance':
            data.MinedMinerals = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'subsites':
            data.Subsites = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          case 'subsites':
            data.Subsites = record.boxValue
              ? record.boxValue
              : record.flagValue;
            break;
          default:
            data = data;
        }
      });
      // }
    });
    return data;
  }
}
