"use client";
import React from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
//import { formularioContactoRequest } from "../api/avu.api";

const validationSchema = Yup.object({
  nombre: Yup.string().required("Requerido"),
  apellidos: Yup.string().required("Requerido"),
  email: Yup.string().email("Email inválido").required("Requerido"),
  celular: Yup.string().required("Requerido"),
  ciudad: Yup.string().required("Requerido"),
  servicio: Yup.string().required("Requerido"),
  mensaje: Yup.string().required("Requerido"),
  //   tratamientoDatos: Yup.boolean().oneOf(
  //     [true],
  //     "Debes aceptar el tratamiento de datos personales"
  //   ),
});

const FormContact = () => (
  <div className="mx-auto mt-7 mb-8 max-w-5xl px-4 md:mt-40 md:px-0">
    <div className="flex flex-col md:flex-row">
      <div className="md:w-1/2 md:pr-4">
        {/* <img src="/img/aq.png" alt="Imagen" className="w-full rounded-md" /> */}
        <svg
          width="100%"
          height="auto"
          viewBox="0 0 300 150"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="100%" height="100%" fill="#f9fafb" rx="10" />

          <text
            x="50%"
            y="40"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="18"
            fill="#333"
            font-weight="bold"
            letter-spacing="0.5"
          >
            Estamos aquí para
          </text>

          <rect x="45" y="60" width="210" height="35" fill="#22C55D" rx="8" />

          <text
            x="50%"
            y="85"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="22"
            fill="white"
            font-weight="bold"
            letter-spacing="1"
          >
            AYUDARTE
          </text>

          <text
            x="50%"
            y="115"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="16"
            fill="#666"
            letter-spacing="0.5"
          >
            con tus consultas
          </text>

          <circle
            cx="250"
            cy="35"
            r="15"
            fill="none"
            stroke="#22C55D"
            stroke-width="2"
          />
          <text
            x="250"
            y="40"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="14"
            fill="#22C55D"
            font-weight="bold"
          >
            ?
          </text>
        </svg>
      </div>
      <div className="md:w-1/2">
        <h1 className="mb-4 text-center text-2xl font-bold md:text-left">
          Escríbenos
        </h1>
        <Formik
          initialValues={{
            nombre: "",
            apellidos: "",
            email: "",
            celular: "",
            ciudad: "",
            servicio: "",
            mensaje: "",
            tratamientoDatos: false,
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              // Hacer la solicitud POST al endpoint del backend
              const response = await fetch("/api/send", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
              });

              if (!response.ok) {
                throw new Error("Error al enviar el formulario");
              }

              const result = await response.json();
              console.log("Respuesta del servidor:", result);
              alert("¡Mensaje enviado correctamente!");
              resetForm();
            } catch (error) {
              console.error("Error al enviar el formulario:", error);
              alert("Hubo un error al enviar el formulario");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  name="nombre"
                  type="text"
                  placeholder="Nombre"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
                {errors.nombre && touched.nombre ? (
                  <div className="text-red-500">{errors.nombre}</div>
                ) : null}
                <Field
                  name="apellidos"
                  type="text"
                  placeholder="Apellidos"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
                {errors.apellidos && touched.apellidos ? (
                  <div className="text-red-500">{errors.apellidos}</div>
                ) : null}
              </div>
              <Field
                name="email"
                type="email"
                placeholder="Email"
                className="w-full rounded-md border border-gray-300 p-2"
              />
              {errors.email && touched.email ? (
                <div className="text-red-500">{errors.email}</div>
              ) : null}
              <Field
                name="celular"
                type="text"
                placeholder="Celular"
                className="w-full rounded-md border border-gray-300 p-2"
              />
              {errors.celular && touched.celular ? (
                <div className="text-red-500">{errors.celular}</div>
              ) : null}
              <Field
                name="ciudad"
                type="text"
                placeholder="Ciudad"
                className="w-full rounded-md border border-gray-300 p-2"
              />
              {errors.ciudad && touched.ciudad ? (
                <div className="text-red-500">{errors.ciudad}</div>
              ) : null}
              <Field
                name="servicio"
                as="select"
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="">Selecciona un servicio</option>
                {/* <option value="mensajeria">Mensajería</option> */}
                <option value="envio_paquete">Envío de paquete</option>
                {/* <option value="envio_documentos">Envío de documentos</option> */}
                <option value="otro">Otro</option>
              </Field>
              {errors.servicio && touched.servicio ? (
                <div className="text-red-500">{errors.servicio}</div>
              ) : null}
              <Field
                name="mensaje"
                as="textarea"
                placeholder="Mensaje"
                className="w-full rounded-md border border-gray-300 p-2"
              />
              {errors.mensaje && touched.mensaje ? (
                <div className="text-red-500">{errors.mensaje}</div>
              ) : null}

              {/* <div className="flex items-center">
                <Field
                  type="checkbox"
                  name="tratamientoDatos"
                  className="mr-2"
                />
                <span>Tratamiento de datos personales *</span>
              </div>
              <span className="block text-sm text-gray-500">
                Aceptar de manera voluntaria, explícita, informada e inequívoca,
                autorizo a mercaenvíos sas para tratar mis datos personales, de
                acuerdo con lo dispuesto en los artículos 5, 7 y concordantes
                del Decreto 1377 de 2013 y las demás disposiciones legales
                referentes al tema. Para mayor información acerca del manejo de
                tus datos personales, puedes revisar nuestro aviso de privacidad
                y nuestra política de privacidad.
              </span>
              {errors.tratamientoDatos && touched.tratamientoDatos ? (
                <div className="text-red-500">{errors.tratamientoDatos}</div>
              ) : null} */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-teal-200 px-4 py-2 text-gray-700 transition-colors duration-300 hover:bg-teal-600"
              >
                {isSubmitting ? "Enviando..." : "Enviar"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  </div>
);

export default FormContact;
