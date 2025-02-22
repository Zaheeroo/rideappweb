'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cancelTrip } from '@/lib/supabase/trips';

interface CancelTripDialogProps {
  tripId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export default function CancelTripDialog({ tripId, onClose, onCancelled }: CancelTripDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!tripId) return;

    setIsSubmitting(true);
    try {
      await cancelTrip(tripId, reason);
      toast.success('Trip cancelled successfully');
      onCancelled();
      onClose();
    } catch (error) {
      console.error('Error cancelling trip:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to cancel trip');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!tripId} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Trip</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-600 mb-4">
            Please provide a reason for cancelling this trip. This helps us improve our service.
          </p>
          <Textarea
            placeholder="Enter cancellation reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Keep Trip
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 