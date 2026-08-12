import { describe, expect, it } from "vitest";
import {
  buildCheckoutUrl,
  eventChecksum,
  integritySignature,
  verifyEventChecksum,
  type WompiEvent,
} from "./wompi";

// Fixtures con hashes precalculados por fuera (shasum -a 256): si cambia el
// orden de concatenación de la firma, estos tests fallan.

describe("integritySignature", () => {
  it("firma referencia + centavos + COP + secreto, en ese orden", () => {
    expect(integritySignature("sub_abc_1", 20000, "prueba_integridad")).toBe(
      "d959534a2d682a27086ae45d285fed24f32bfd53317ae9983db7e80aed876d1e"
    );
  });
});

describe("buildCheckoutUrl", () => {
  it("arma la URL del checkout con todos los parámetros", () => {
    const url = new URL(
      buildCheckoutUrl({
        publicKey: "pub_test_123",
        reference: "sub_abc_1",
        amountInCents: 20000,
        integritySecret: "prueba_integridad",
        redirectUrl: "https://mercado.test/dashboard/suscripcion",
      })
    );
    expect(url.origin + url.pathname).toBe("https://checkout.wompi.co/p/");
    expect(url.searchParams.get("public-key")).toBe("pub_test_123");
    expect(url.searchParams.get("currency")).toBe("COP");
    expect(url.searchParams.get("amount-in-cents")).toBe("20000");
    expect(url.searchParams.get("reference")).toBe("sub_abc_1");
    expect(url.searchParams.get("signature:integrity")).toBe(
      "d959534a2d682a27086ae45d285fed24f32bfd53317ae9983db7e80aed876d1e"
    );
    expect(url.searchParams.get("redirect-url")).toBe(
      "https://mercado.test/dashboard/suscripcion"
    );
  });
});

describe("eventos de Wompi", () => {
  const event: WompiEvent = {
    event: "transaction.updated",
    data: {
      transaction: {
        id: "01-TEST",
        status: "APPROVED",
        amount_in_cents: 2000000,
        reference: "sub_abc_1",
      },
    },
    timestamp: 1530291411,
    signature: {
      properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
      checksum: "0992c9c4353ca5e9d6e68503b24af4da2c8d7e047ea2f7f628a1fe7a80a1b423",
    },
  };

  it("calcula el checksum concatenando propiedades + timestamp + secreto", () => {
    expect(eventChecksum(event, "test_events_secret")).toBe(event.signature.checksum);
  });

  it("acepta el evento con checksum válido (sin importar mayúsculas)", () => {
    const upper = {
      ...event,
      signature: { ...event.signature, checksum: event.signature.checksum.toUpperCase() },
    };
    expect(verifyEventChecksum(upper, "test_events_secret")).toBe(true);
  });

  it("rechaza checksum inválido o secreto equivocado", () => {
    expect(verifyEventChecksum(event, "otro_secreto")).toBe(false);
    const alterado = {
      ...event,
      data: { transaction: { ...event.data.transaction, amount_in_cents: 1 } },
    };
    expect(verifyEventChecksum(alterado, "test_events_secret")).toBe(false);
  });
});
