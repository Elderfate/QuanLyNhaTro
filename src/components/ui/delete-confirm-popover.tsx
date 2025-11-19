'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmPopoverProps {
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  iconOnly?: boolean;
  children?: React.ReactNode;
}

export function DeleteConfirmPopover({
  onConfirm,
  title = 'Xác nhận xóa',
  description = 'Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.',
  disabled = false,
  loading = false,
  className,
  buttonVariant = 'destructive',
  buttonSize = 'icon',
  iconOnly = true,
  children,
}: DeleteConfirmPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          disabled={disabled || loading || isDeleting}
          className={cn(
            iconOnly && 'h-8 w-8 p-0',
            className
          )}
        >
          {loading || isDeleting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : children ? (
            children
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              {!iconOnly && <span className="ml-2">Xóa</span>}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        side="top"
        sideOffset={8}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground">
                {title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {description}
          </p>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="min-w-[80px]"
            >
              {isDeleting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Đang xóa...
                </>
              ) : (
                'Xóa'
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
