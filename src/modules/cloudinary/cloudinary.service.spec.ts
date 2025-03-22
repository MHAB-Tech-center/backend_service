import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { BadRequestException } from '@nestjs/common';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFileName', () => {
    it('should generate a unique filename with timestamp', () => {
      const originalName = 'test-image.jpg';
      const fileName = (service as any).generateFileName(originalName);

      expect(fileName).toMatch(/^test-image_\d+$/);
    });

    it('should handle filenames with multiple dots', () => {
      const originalName = 'test.image.jpg';
      const fileName = (service as any).generateFileName(originalName);

      expect(fileName).toMatch(/^test.image_\d+$/);
    });
  });

  describe('uploadImage', () => {
    it('should upload an image successfully', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockResponse: UploadApiResponse = {
        asset_id: 'test-asset-id',
        public_id: 'test-public-id',
        version: 1,
        version_id: 'test-version-id',
        signature: 'test-signature',
        width: 100,
        height: 100,
        format: 'jpg',
        resource_type: 'image',
        created_at: '2024-01-01',
        bytes: 1000,
        type: 'upload',
        url: 'https://test-url.com/image.jpg',
        secure_url: 'https://test-url.com/image.jpg',
        original_filename: 'test.jpg',
        tags: [],
        pages: 1,
        etag: 'test-etag',
        placeholder: false,
        api_key: 'test-api-key',
        api_secret: 'test-api-secret',
        colors: [],
        faces: [] as string[],
        quality_analysis: {},
        context: {},
        moderation: [],
        access_mode: 'public',
        access_control: [],
        phash: 'test-phash',
        exif: {},
        image_metadata: {},
        metadata: {},
        created_by: {},
        uploaded_by: {},
      };

      // Mock the cloudinary upload_stream
      const mockUploadStream = jest
        .fn()
        .mockImplementation((options, callback) => {
          callback(null, mockResponse);
        });

      // Mock the v2.uploader.upload_stream
      jest
        .spyOn(require('cloudinary').v2.uploader, 'upload_stream')
        .mockImplementation(mockUploadStream);

      const result = await service.uploadImage(mockFile);

      expect(result).toEqual(mockResponse);
      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'kabstore/products',
          public_id: expect.stringMatching(/^test_\d+$/),
        }),
        expect.any(Function),
      );
    });

    it('should handle upload errors', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      // Mock the cloudinary upload_stream to simulate an error
      const mockUploadStream = jest
        .fn()
        .mockImplementation((options, callback) => {
          callback(new Error('Upload failed'), null);
        });

      // Mock the v2.uploader.upload_stream
      jest
        .spyOn(require('cloudinary').v2.uploader, 'upload_stream')
        .mockImplementation(mockUploadStream);

      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        'Upload failed',
      );
      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'kabstore/products',
          public_id: expect.stringMatching(/^test_\d+$/),
        }),
        expect.any(Function),
      );
    });

    it('should handle invalid file types', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      // Mock the cloudinary upload_stream to simulate an error
      const mockUploadStream = jest
        .fn()
        .mockImplementation((options, callback) => {
          callback(new Error('Invalid file type'), null);
        });

      // Mock the v2.uploader.upload_stream
      jest
        .spyOn(require('cloudinary').v2.uploader, 'upload_stream')
        .mockImplementation(mockUploadStream);

      await expect(service.uploadImage(mockFile)).rejects.toThrow(
        'Invalid file type',
      );
      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'kabstore/products',
          public_id: expect.stringMatching(/^test_\d+$/),
        }),
        expect.any(Function),
      );
    });
  });
});
