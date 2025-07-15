
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ContactProfile from './ContactProfile';

interface ContactProfileModalProps {
  contactPhone: string;
  isOpen: boolean;
  onClose: () => void;
}

const ContactProfileModal = ({ contactPhone, isOpen, onClose }: ContactProfileModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ContactProfile contactPhone={contactPhone} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default ContactProfileModal;
