import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InspectionReview } from 'src/entities/inspection-review.entity';
import { InspectionPlan } from 'src/entities/InspectionPlan.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(InspectionReview)
    public reviewRepository: Repository<InspectionReview>,
  ) {}

  async existsByCommentAndPlan(planId: any, comment: string) {
    const review = await this.reviewRepository.findOne({
      where: {
        inspectionPlan: {
          id: planId,
        },
        comment: comment,
      },
    });
    return !!review;
  }

  async saveReview(comment: string, inspectionPlan: InspectionPlan) {
    if (await this.existsByCommentAndPlan(inspectionPlan.id, comment))
      throw new BadRequestException(
        'The review with the provided comment and inspection plan already esitsts',
      );
    const review  = new InspectionReview(comment, inspectionPlan);
    return await this.reviewRepository.save(review);
  }
}
