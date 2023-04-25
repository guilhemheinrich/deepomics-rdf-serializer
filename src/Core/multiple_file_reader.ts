
import { ReadStream, WriteStream } from 'fs'
import fs from 'fs-extra'
import { Readable } from 'stream'

export default  function multiple_file_stream(consumer: (readStream: ReadStream, writeStream: WriteStream) => Readable, writeStream: WriteStream, ...files_pathes: string[]) {
    let read_streams = files_pathes.map((file_path) => fs.createReadStream(file_path))
    let end_cpt = 0
    // Close at the last readed stream
    // read_streams[read_streams.length-1].on('end', () => {
    //     end_cpt +=1
    //     if (end_cpt)
    //     writeStream.close()
    // })
    for (let read_stream of read_streams) {
        read_stream.on('end', () => {
            end_cpt +=1
            if (end_cpt == (read_streams.length - 1))
            writeStream.close()
        })
        consumer(read_stream, writeStream)
    }

}
