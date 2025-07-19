import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';

import type { PropsWithChildren } from 'react';

export interface ModalProps {
  title: string;
  buttonLabel: string;
  buttonClassName?: string;
  contentClassName?: string;
}

const Modal = (props: PropsWithChildren<ModalProps>): React.JSX.Element => {
  const { title, buttonLabel, buttonClassName, contentClassName, children } = props;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className={`bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500 ${buttonClassName}`}>
          {buttonLabel}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content
          className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg max-w-md w-full p-6 ${contentClassName}`}
        >
          <Dialog.Title className="text-lg font-semibold">
            {title}
          </Dialog.Title>

          <div>
            {children}
          </div>

          <div className="mt-4 flex justify-end">
            <Dialog.Close asChild>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500">
                Close
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Modal;
