

exports.getSize = (size) => {
        result = (size / 1024 / 1024);
        if (result > 999){
            return `${(result /1024).toFixed(2)}GB`
        }
        return `${result.toFixed(2)} MB`

}


