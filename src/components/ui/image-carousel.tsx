'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { X, ZoomIn } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  trigger?: React.ReactNode;
  className?: string;
}

export function ImageCarousel({ 
  images, 
  trigger,
  className = '' 
}: ImageCarouselProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Cập nhật current slide khi carousel thay đổi
  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (!images || images.length === 0) {
    return null;
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsOpen(true)}
      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
    >
      <ZoomIn className="h-4 w-4 mr-2" />
      Xem ảnh ({images.length})
    </Button>
  );

  return (
    <>
      {trigger || defaultTrigger}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Hình ảnh phòng</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="px-6 pb-6">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative">
                      <img
                        src={image}
                        alt={`Ảnh phòng ${index + 1}`}
                        className="w-full h-[500px] object-cover rounded-lg"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            
            {images.length > 1 && (
              <div className="flex items-center justify-center mt-4 space-x-2">
                <span className="text-sm text-gray-500">
                  {current + 1} / {images.length}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
