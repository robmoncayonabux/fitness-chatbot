import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "src/ai/ai.class";
import {
	clearHistory,
	handleHistory,
	getHistoryParse,
} from "../utils/handleHistory";

const generateJsonParseForPayment = (history: any, name: string, email: string, identificacion: string, cellphone: string) => {
	const prompt = `Basado en el historial de conversación: ${history}s
    Analiza la información proporcionada y genera un objeto JSON para el proceso de pago, estrictamente siempre debera tener la siguente sintaxis en ingles.

		--------------------------------------------------------
		ejemplo de sintaxis
			client: {
				name: "John Doe",
				email: "hola@ejemplo.com"
				identification: "1234567890",
				cellphone: "1234567890"
				orderItems: [
					{
						name: "Pizza de pepperoni",
						quantity: 1,
						price: 10.00
					}
				]
			}
		--------------------------------------------------------

    Datos del Cliente:
    - nombre: "${name}"
    - email: "${email}"
    - identificacion: "${identificacion}"
		- celular: "${cellphone}
    
    Objeto JSON a generar para el pago:`;

	return prompt;
};

/**
 * Flujo para manejar el proceso de pago
 */
const confirmFlow = addKeyword("pay")
	.addAction(async (_, { state, flowDynamic }) => {
		await flowDynamic("Por favor, introduce tu email:");
		await handleHistory(
			{ role: "system", content: "Por favor, introduce tu email:" },
			state
		);
	})
	.addAction(
		{ capture: true },
		async (ctx, { state, flowDynamic, fallBack }) => {
			if (ctx.body.includes("@") && ctx.body.includes(".")) {
				await state.update({ email: ctx.body });
				await handleHistory({ role: "user", content: ctx.body }, state);
				await flowDynamic("Ahora, necesito tu nombre:");
				await handleHistory(
					{ role: "system", content: "Ahora, necesito tu nombre:" },
					state
				);
			} else {
				return fallBack(
					"El email proporcionado no es válido. Por favor, introduce un email válido:"
				);
			}
		}
	)
	.addAction(
		{ capture: true },
		async (ctx, { state, flowDynamic, fallBack }) => {
			if (ctx.body.trim().split(" ").length > 1) {
				await state.update({ name: ctx.body.trim() });
				await handleHistory(
					{ role: "user", content: ctx.body.trim() },
					state
				);
				await flowDynamic("Por último, ingresa tu cédula:");
				await handleHistory(
					{
						role: "system",
						content: "Por último, ingresa tu cédula:",
					},
					state
				);
			} else {
				return fallBack(
					"Por favor, introduce tu nombre y apellido:"
				);
			}
		}
	)
	.addAction(
		{ capture: true },
		async (ctx, { state, flowDynamic, fallBack }) => {
			if (ctx.body.trim().length > 8) {
				await state.update({ identification: ctx.body.trim() });
				await handleHistory(
					{ role: "user", content: ctx.body.trim() },
					state
				);
				await flowDynamic(
					"Gracias por proporcionar tus datos, estoy generando tu link de pago"
				);
				await handleHistory(
					{
						role: "system",
						content:
							"Gracias por proporcionar tus datos, estoy generando tu link de pago",
					},
					state
				);
			} else {
				return fallBack(
					"La cédula debe tener más de 8 dígitos. Por favor, reintroduce tu cédula:"
				);
			}
		}
	)
	.addAction(async (ctx, { state, flowDynamic, extensions }) => {
		const email = state.get("email");
		const name = state.get("name");
		const identification = state.get("identification");
		const cellphone = ctx.from

		const history = getHistoryParse(state);
		console.log('historial', history)
		const ai = extensions.ai as AIClass;
		const prompt = generateJsonParseForPayment(
			history,
			name,
			email,
			identification,
			cellphone
		);
		const jsonPaymentInfo = await ai.createChat([
			{ role: "system", content: prompt },
		]);
		console.log(`JSON para Pago: ${jsonPaymentInfo}`);
		clearHistory(state);
		console.log('Historial de conversación limpio', state.getAllState())

		await flowDynamic('Listo!, tu pedido llegará en unos minutos. Gracias por tu compra! 🍕🚀🎉')
	});

export { confirmFlow };