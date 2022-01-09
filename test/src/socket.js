import { io } from "socket.io-client";

// const url = window.origin;

const socket = io("http://10.12.7.4:5000", {
	reconnectionDelayMax: 10000,
	auth: {
	  token: "123"
	},
	query: {
	  "my-key": "my-value"
	}
  });
export default socket