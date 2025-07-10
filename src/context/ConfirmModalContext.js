import { createContext, useContext, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";

const ConfirmModalContext = createContext();

export const useConfirmModal = () => useContext(ConfirmModalContext);

export const ConfirmModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState(null);

  const showConfirmModal = (config) => {
    setModalConfig(config);
  };

  const closeConfirmModal = () => {
    setModalConfig(null);
  };

  return (
    <ConfirmModalContext.Provider value={{ showConfirmModal }}>
      {children}
      {modalConfig && (
        <ConfirmModal
          isOpen={true}
          onClose={closeConfirmModal}
          {...modalConfig}
        />
      )}
    </ConfirmModalContext.Provider>
  );
};