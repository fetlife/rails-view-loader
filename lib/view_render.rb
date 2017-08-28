# encoding:utf-8
# frozen_string_literal: true

options   = JSON.parse STDIN.read
delimiter = options['delimiter']
resource  = options['resource']
layout    = options['layout']
variant   = options['variant']

url   = URI.parse resource
query = URI.decode_www_form(url.query.to_s).to_h

file = url.path

file    = file.remove(File.extname(file))
layout  ||= query['layout'] || false
variant ||= query['variant']

output = ApplicationController.render(file: file, layout: layout, variant: variant)
puts "#{delimiter}#{output}#{delimiter}"
