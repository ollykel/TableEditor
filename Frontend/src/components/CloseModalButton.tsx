import { X } from 'lucide-react';

export interface CloseModalButtonProps {
  closeModal: () => void;
}

const CloseModalButton = (props: CloseModalButtonProps): React.JSX.Element => {
  const { closeModal } = props;

  return (
    <div className="flex justify-end">
      <button
        onClick={closeModal}
        className="hover:cursor-pointer"
      >
        <X />
      </button>
    </div>
  );
};

export default CloseModalButton;
