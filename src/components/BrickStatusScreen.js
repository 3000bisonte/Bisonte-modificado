"use client";
import { StatusScreen } from "@mercadopago/sdk-react";
import classnames from "classnames";
import React, { useEffect } from "react";

import { Context } from "../app/ContextProvider";
//import { useParams } from "react-router-dom";
const urlStatusScreen = process.env.NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN;
const Screen = ({ onClick: _onClick }) => {
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
    if (resolvedPaymentId) {setIsVisible(true);}
  }, [resolvedPaymentId]);
  const baseReturnUrl = urlStatusScreen || (typeof window !== 'undefined' ? window.location.origin : '');
  const customization = {
    visual: {
      texts: {
        // Evitar warnings del Brick por textos vacíos
        ctaGeneralErrorLabel: "Intentar nuevamente",
        ctaCardErrorLabel: "Verificar datos de tarjeta",
        ctaReturnLabel: "Ir a Mis Envíos",
      },
      showExternalReference: true,
    },
  backUrls: {
      //error: "<http://<your_domain>/error>",
      //return: "https://mercaenvios.com/dashboard/mis-envios",
      //return: "http://localhost:3000/misenvios",
      return: `${baseReturnUrl}/misenvios`,
    },
  };
  // No montar el Brick si no hay paymentId para evitar llamadas a /bricks/payments/null
  if (!resolvedPaymentId) {
    return null;
  }

  return (
    <section className={shoppingCartClass}>
      <StatusScreen
        initialization={{ paymentId: resolvedPaymentId }} // ID del pago para mostrar
        customization={customization}
      />
    </section>
  );
};

export default Screen;
