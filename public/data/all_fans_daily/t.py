import os

# 12-02当日的数据

sqlQueryTemplate = "INSERT INTO top_uploaders (`up_id`, `up_name`, `up_addr`, `follower_num`, `video_num`, `charge_num`, `type_first`, `type_second`) VALUES ("

filePath = 'data.csv'

with open("query.txt", "w") as my_file:
    with open("data.csv", "r", encoding="gbk") as f:
        line = f.readline()
        print(line)

        line = f.readline()
        while line:
            lineSplit = line.split(',')

            '''
            `up_id`, 
            `up_name`, 
            `up_addr`, 
            `follower_num`, 
            `video_num`, 
            `charge_num`, 
            `type_first`, 
            `type_second`
            '''
            # print(lineSplit)
            if lineSplit[6] == '':
                lineSplit[6] = '0'
            sqlQuery = sqlQueryTemplate\
                + lineSplit[0]\
                + ","+"'"+lineSplit[1]+"'"\
                + ","+"'"+lineSplit[2]+"'"\
                + ","+lineSplit[4]\
                + ","+lineSplit[5]\
                + ","+lineSplit[6]\
                + ","+"'"+lineSplit[7]+"'"\
                + ","+"'"+lineSplit[8][:-1]+"'"\
                + ");"
            # print(sqlQuery)

            my_file.write(sqlQuery+"\n")
            line = f.readline()
