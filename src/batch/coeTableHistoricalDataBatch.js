(async () => {
async function handlerAsyncFunction() {
  try {
    console.log("In the batch function")
    } catch (error) {
      console.log(error)
    }
}
  await handlerAsyncFunction();
})();