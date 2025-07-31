import { useState } from 'react';

import type { PropsWithChildren } from 'react';

export interface ModalProps {
  width: string;
  height: string;
  zIndex?: number;
}

export interface UseModalResult {
  Modal: (props: PropsWithChildren<ModalProps>) => React.JSX.Element;
  openModal: () => void;
  closeModal: () => void;
}

export const useModal = (): UseModalResult => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal = () => { setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); };
  const Modal = (props: PropsWithChildren<ModalProps>) => {
    if (! isOpen) {
      return null;
    } else {
      const { width, height, zIndex, children } = props;
      const zIndexBg = zIndex || 500;

      return (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: zIndexBg,
            width: `100%`,
            height: `100%`,
            backgroundColor: 'rgb(0, 0, 0)',
            opacity: 0.5

          }}>
          </div>
          <div style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: zIndexBg + 1,
            width: `100%`,
            height: `100%`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',

          }}>
            <div style={{
              position: 'fixed',
              backgroundColor: 'white',
              width,
              height
            }}>
              {children}
            </div>
          </div>
        </>
      );
    }
  };

  return ({ Modal, openModal, closeModal });
};
