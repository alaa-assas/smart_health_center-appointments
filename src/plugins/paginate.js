function paginatePlugin(schema) {
    schema.statics.paginate = function({ page = 1, limit = 5 }) {
        const query = this.find();

        query.skip((page - 1) * limit) 
            .limit(limit) 
            .sort({ createdAt: 1 });
        
        query.execPaginate = async function () { 
            const counts = await this.model.countDocuments(this.getQuery()); 
            
            const data = await query.exec();
                    
            const pages = Math.ceil(counts / limit);

            return {
                total: counts,
                page,
                pages,
                isNext: page < pages,
                isPrevious: page > 1,
                data
            }
        }

        return query;
    }
}

module.exports = paginatePlugin;