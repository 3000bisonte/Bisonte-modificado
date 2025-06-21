"use client";
import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { StatusScreen } from "@mercadopago/sdk-react";
import { Context } from "../app/ContextProvider";
//import { useParams } from "react-router-dom";
const urlStatusScreen = process.env.NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN;
const Screen = ({ onClick }) => {
  // Captura el parámetro de la URL
  //const { payment_id } = useParams();
  const [isVisible, setIsVisible] = React.useState(false);
  const { paymentId } = React.useContext(Context);
  // Definir un único ID de pago, priorizando `payment_id` de la URL si está disponible
  const resolvedPaymentId = paymentId;
  console.log("resolvedPaymentId", resolvedPaymentId);
  const shoppingCartClass = classnames("shopping-cart dark", {
    "shopping-cart--hidden": !isVisible,
  });

  useEffect(() => {
    if (resolvedPaymentId) setIsVisible(true);
  }, [resolvedPaymentId]);
  const customization = {
    visual: {
      texts: {
        ctaGeneralErrorLabel: "",
        ctaCardErrorLabel: "",
        ctaReturnLabel: "Ir a Mis Envíos",
      },
      showExternalReference: true,
    },
    backUrls: {
      //error: "<http://<your_domain>/error>",
      //return: "https://mercaenvios.com/dashboard/mis-envios",
      //return: "http://localhost:3000/misenvios",
      return: `${urlStatusScreen}/misenvios`,
    },
  };
  return (
    <section className={shoppingCartClass}>
      <StatusScreen
        initialization={{ paymentId: resolvedPaymentId }} // ID del pago para mostrar
        customization={customization}

        // onReady={onReady}
        // onError={onError}
      />
    </section>
  );
};

export default Screen;
