// components/MenuButton.js
import React from "react";

const MenuButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed top-4 left-4 p-2 bg-teal-600 text-white rounded-full"
  >
    ☰
  </button>
);

export default MenuButton;
