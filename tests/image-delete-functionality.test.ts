// Jest test for image deletion functionality

// Mock data for testing
const mockImagesForDelete = [
  {
    id: '1',
    url: 'https://example.com/image1.jpg',
    filename: 'image1.jpg',
    mimeType: 'image/jpeg',
    alt: 'Image 1',
    isPrimary: true,
    uploadedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    url: 'https://example.com/image2.jpg',
    filename: 'image2.jpg',
    mimeType: 'image/jpeg',
    alt: 'Image 2',
    isPrimary: false,
    uploadedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    url: 'https://example.com/image3.jpg',
    filename: 'image3.jpg',
    mimeType: 'image/jpeg',
    alt: 'Image 3',
    isPrimary: false,
    uploadedAt: '2024-01-03T00:00:00Z',
  },
];

// Test the delete image logic
describe('Image Deletion', () => {
  it('should delete a specific image', () => {
    const deleteImage = (
      imageId: string,
      images: typeof mockImagesForDelete
    ) => {
      return images.filter(img => img.id !== imageId);
    };

    // Test deleting image 2
    const result = deleteImage('2', mockImagesForDelete);

    // Verify image 2 is removed
    expect(result).toHaveLength(2);
    expect(result.find(img => img.id === '2')).toBeUndefined();

    // Verify other images remain
    expect(result.find(img => img.id === '1')).toBeDefined();
    expect(result.find(img => img.id === '3')).toBeDefined();
  });

  it('should handle deleting primary image and make first remaining image primary', () => {
    const deleteImage = (
      imageId: string,
      images: typeof mockImagesForDelete
    ) => {
      const updatedImages = images.filter(img => img.id !== imageId);

      // If we deleted the primary image and there are other images, make the first one primary
      const deletedImage = images.find(img => img.id === imageId);
      if (deletedImage?.isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
      }

      return updatedImages;
    };

    // Test deleting primary image (image 1)
    const result = deleteImage('1', mockImagesForDelete);

    // Verify image 1 is removed
    expect(result).toHaveLength(2);
    expect(result.find(img => img.id === '1')).toBeUndefined();

    // Verify first remaining image (image 2) is now primary
    expect(result[0].id).toBe('2');
    expect(result[0].isPrimary).toBe(true);

    // Verify other images are not primary
    expect(result[1].isPrimary).toBe(false);
  });

  it('should handle deleting non-primary image without changing primary status', () => {
    const deleteImage = (
      imageId: string,
      images: typeof mockImagesForDelete
    ) => {
      const updatedImages = images.filter(img => img.id !== imageId);

      // If we deleted the primary image and there are other images, make the first one primary
      const deletedImage = images.find(img => img.id === imageId);
      if (deletedImage?.isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
      }

      return updatedImages;
    };

    // Test deleting non-primary image (image 3)
    const result = deleteImage('3', mockImagesForDelete);

    // Verify image 3 is removed
    expect(result).toHaveLength(2);
    expect(result.find(img => img.id === '3')).toBeUndefined();

    // Verify primary image (image 1) remains primary
    expect(result.find(img => img.id === '1')?.isPrimary).toBe(true);

    // Verify other image (image 2) remains non-primary
    expect(result.find(img => img.id === '2')?.isPrimary).toBe(false);

    // Verify the order is maintained (primary first)
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('should handle deleting the only image', () => {
    const singleImage = [mockImagesForDelete[0]];

    const deleteImage = (
      imageId: string,
      images: typeof mockImagesForDelete
    ) => {
      return images.filter(img => img.id !== imageId);
    };

    // Test deleting the only image
    const result = deleteImage('1', singleImage);

    // Verify all images are removed
    expect(result).toHaveLength(0);
  });
});
