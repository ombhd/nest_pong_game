import { io } from "socket.io-client";

// const url = window.origin;

const socket = io("http://localhost:5000", {
	reconnectionDelayMax: 10000,
	auth: {
	  token: "123"
	},
	query: {
	  "my-key": "my-value"
	}
  });
export default socket