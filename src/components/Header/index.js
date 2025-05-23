import React, { useState } from "react";
import "./styles.css";
import { TbMoneybag } from "react-icons/tb";
import { AiFillSetting } from "react-icons/ai";
import UserProfile from "../UserProfileFeture";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openOrder, setIsOpenOrder] = useState(0);

  const handleOpen = () => {
    if (openOrder === 0) {
      setIsOpen(true);
      setIsOpenOrder(1);
    } else {
      setIsOpen(false);
      setIsOpenOrder(0);
    }
  };

  return (
    <>
      <div className="navbar">
        <h2>ShivayLedger</h2>
        <TbMoneybag className="logo-image" />
        <AiFillSetting className="menu-btn" onClick={handleOpen} />
      </div>
      {isOpen && <UserProfile className="profile" />}
    </>
  );
};

export default Header;
