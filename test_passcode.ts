const res = await fetch("http://localhost:4000/api/meetings/non-existent/passcode", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ passcode: "123456" }),
});
const text = await res.text();
console.log("Status:", res.status, "Response text:", text);

